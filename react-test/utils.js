const fs = require('fs-extra')
const https = require('https')
const path = require('path')
const semver = require('semver')
const chalk = require('chalk')
const os = require('os')
const execSync = require('child_process').execSync
const validateProjectName = require('validate-npm-package-name')

function checkForLatestVersion() {
    return new Promise((resolve, reject) => {
        https
            .get('https://registry.npmjs.org/-/package/create-react-app/dist-tags', (res) => {
                if (res.statusCode === 200) {
                    let body = ''
                    res.on('data', (data) => (body += data))
                    res.on('end', () => {
                        resolve(JSON.parse(body).latest)
                    })
                } else {
                    reject()
                }
            })
            .on('error', () => {
                reject()
            })
    })
}

function createApp(name, verbose, version, template, useYarn, usePnp) {
    const unsupportedNodeVersion = !semver.satisfies(
        // Coerce strings with metadata (i.e. `15.0.0-nightly`).
        semver.coerce(process.version),
        '>=14'
    )

    if (unsupportedNodeVersion) {
        console.log(
            chalk.yellow(
                `You are using Node ${process.version} so the project will be bootstrapped with an old unsupported version of tools.\n\n` +
                    `Please update to Node 14 or higher for a better, fully supported experience.\n`
            )
        )
        // Fall back to latest supported react-scripts on Node 4
        version = 'react-scripts@0.9.x'
    }

    const root = path.resolve(name)
    const appName = path.basename(root)

    console.log(root, appName)
    checkAppName(appName)
    fs.ensureDirSync(name)
    if (!isSafeToCreateProjectIn(root, name)) {
        process.exit(1)
    }
    console.log()

    console.log(`Creating a new React app in ${chalk.green(root)}.`)
    console.log()

    const packageJson = {
        name: appName,
        version: '0.1.0',
        private: true
    }

    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify(packageJson, null, 2) + os.EOL)

    const originalDirectory = process.cwd()
    process.chdir(root)
    console.log(root, 'root')
    console.log(checkThatNpmCanReadCwd())
    if (!useYarn && !checkThatNpmCanReadCwd()) {
        process.exit(1)
    }

    if (!useYarn) {
        fs.unlinkSync(path.join(root, 'package.json'))
        const npmInfo = checkNpmVersion()
        if (!npmInfo.hasMinNpm) {
            if (npmInfo.npmVersion) {
                console.log(
                    chalk.yellow(
                        `You are using npm ${npmInfo.npmVersion} so the project will be bootstrapped with an old unsupported version of tools.\n\n` +
                            `Please update to npm 6 or higher for a better, fully supported experience.\n`
                    )
                )
            }
            // Fall back to latest supported react-scripts for npm 3
            version = 'react-scripts@0.9.x'
        }
    } else if (usePnp) {
        const yarnInfo = checkYarnVersion()
        if (yarnInfo.yarnVersion) {
            if (!yarnInfo.hasMinYarnPnp) {
                console.log(
                    chalk.yellow(
                        `You are using Yarn ${yarnInfo.yarnVersion} together with the --use-pnp flag, but Plug'n'Play is only supported starting from the 1.12 release.\n\n` +
                            `Please update to Yarn 1.12 or higher for a better, fully supported experience.\n`
                    )
                )
                // 1.11 had an issue with webpack-dev-middleware, so better not use PnP with it (never reached stable, but still)
                usePnp = false
            }
            if (!yarnInfo.hasMaxYarnPnp) {
                console.log(
                    chalk.yellow(
                        'The --use-pnp flag is no longer necessary with yarn 2 and will be deprecated and removed in a future release.\n'
                    )
                )
                // 2 supports PnP by default and breaks when trying to use the flag
                usePnp = false
            }
        }
    }

    run(root, appName, version, verbose, originalDirectory, template, useYarn, usePnp)
}

function checkAppName(appName) {
    const validationResult = validateProjectName(appName)
    if (!validationResult.validForNewPackages) {
        console.error(chalk.red(`Cannot create a project named ${chalk.green(`"${appName}"`)} because of npm naming restrictions:\n`))
        ;[...(validationResult.errors || []), ...(validationResult.warnings || [])].forEach((error) => {
            console.error(chalk.red(`  * ${error}`))
        })
        console.error(chalk.red('\nPlease choose a different project name.'))
        process.exit(1)
    }

    // TODO: there should be a single place that holds the dependencies
    const dependencies = ['react', 'react-dom', 'react-scripts'].sort()
    if (dependencies.includes(appName)) {
        console.error(
            chalk.red(
                `Cannot create a project named ${chalk.green(`"${appName}"`)} because a dependency with the same name exists.\n` +
                    `Due to the way npm works, the following names are not allowed:\n\n`
            ) +
                chalk.cyan(dependencies.map((depName) => `  ${depName}`).join('\n')) +
                chalk.red('\n\nPlease choose a different project name.')
        )
        process.exit(1)
    }
}

function isSafeToCreateProjectIn(root, name) {
    const validFiles = [
        '.DS_Store',
        '.git',
        '.gitattributes',
        '.gitignore',
        '.gitlab-ci.yml',
        '.hg',
        '.hgcheck',
        '.hgignore',
        '.idea',
        '.npmignore',
        '.travis.yml',
        'docs',
        'LICENSE',
        'README.md',
        'mkdocs.yml',
        'Thumbs.db'
    ]
    // These files should be allowed to remain on a failed install, but then
    // silently removed during the next create.
    const errorLogFilePatterns = ['npm-debug.log', 'yarn-error.log', 'yarn-debug.log']
    const isErrorLog = (file) => {
        return errorLogFilePatterns.some((pattern) => file.startsWith(pattern))
    }

    const conflicts = fs
        .readdirSync(root)
        .filter((file) => !validFiles.includes(file))
        // IntelliJ IDEA creates module files before CRA is launched
        .filter((file) => !/\.iml$/.test(file))
        // Don't treat log files from previous installation as conflicts
        .filter((file) => !isErrorLog(file))

    if (conflicts.length > 0) {
        console.log(`The directory ${chalk.green(name)} contains files that could conflict:`)
        console.log()
        for (const file of conflicts) {
            try {
                const stats = fs.lstatSync(path.join(root, file))
                if (stats.isDirectory()) {
                    console.log(`  ${chalk.blue(`${file}/`)}`)
                } else {
                    console.log(`  ${file}`)
                }
            } catch (e) {
                console.log(`  ${file}`)
            }
        }
        console.log()
        console.log('Either try using a new directory name, or remove the files listed above.')

        return false
    }

    // Remove any log files from a previous installation.
    fs.readdirSync(root).forEach((file) => {
        if (isErrorLog(file)) {
            fs.removeSync(path.join(root, file))
        }
    })
    return true
}

function checkThatNpmCanReadCwd() {
    const cwd = process.cwd()
    let childOutput = null
    try {
        // Note: intentionally using spawn over exec since
        // the problem doesn't reproduce otherwise.
        // `npm config list` is the only reliable way I could find
        // to reproduce the wrong path. Just printing process.cwd()
        // in a Node process was not enough.
        childOutput = spawn.sync('npm', ['config', 'list']).output.join('')
    } catch (err) {
        // Something went wrong spawning node.
        // Not great, but it means we can't do this check.
        // We might fail later on, but let's continue.
        return true
    }
    if (typeof childOutput !== 'string') {
        return true
    }
    const lines = childOutput.split('\n')
    // `npm config list` output includes the following line:
    // "; cwd = C:\path\to\current\dir" (unquoted)
    // I couldn't find an easier way to get it.
    const prefix = '; cwd = '
    const line = lines.find((line) => line.startsWith(prefix))
    if (typeof line !== 'string') {
        // Fail gracefully. They could remove it.
        return true
    }
    const npmCWD = line.substring(prefix.length)
    if (npmCWD === cwd) {
        return true
    }
    console.error(
        chalk.red(
            `Could not start an npm process in the right directory.\n\n` +
                `The current directory is: ${chalk.bold(cwd)}\n` +
                `However, a newly started npm process runs in: ${chalk.bold(npmCWD)}\n\n` +
                `This is probably caused by a misconfigured system terminal shell.`
        )
    )
    if (process.platform === 'win32') {
        console.error(
            chalk.red(`On Windows, this can usually be fixed by running:\n\n`) +
                `  ${chalk.cyan('reg')} delete "HKCU\\Software\\Microsoft\\Command Processor" /v AutoRun /f\n` +
                `  ${chalk.cyan('reg')} delete "HKLM\\Software\\Microsoft\\Command Processor" /v AutoRun /f\n\n` +
                chalk.red(`Try to run the above two lines in the terminal.\n`) +
                chalk.red(`To learn more about this problem, read: https://blogs.msdn.microsoft.com/oldnewthing/20071121-00/?p=24433/`)
        )
    }
    return false
}

function run(root, appName, version, verbose, originalDirectory, template, useYarn, usePnp) {
    Promise.all([getInstallPackage(version, originalDirectory), getTemplateInstallPackage(template, originalDirectory)]).then(
        ([packageToInstall, templateToInstall]) => {
            const allDependencies = ['react', 'react-dom', packageToInstall]

            console.log('Installing packages. This might take a couple of minutes.')

            Promise.all([getPackageInfo(packageToInstall), getPackageInfo(templateToInstall)])
                .then(([packageInfo, templateInfo]) =>
                    checkIfOnline(useYarn).then((isOnline) => ({
                        isOnline,
                        packageInfo,
                        templateInfo
                    }))
                )
                .then(({ isOnline, packageInfo, templateInfo }) => {
                    let packageVersion = semver.coerce(packageInfo.version)

                    const templatesVersionMinimum = '3.3.0'

                    // Assume compatibility if we can't test the version.
                    if (!semver.valid(packageVersion)) {
                        packageVersion = templatesVersionMinimum
                    }

                    // Only support templates when used alongside new react-scripts versions.
                    const supportsTemplates = semver.gte(packageVersion, templatesVersionMinimum)
                    if (supportsTemplates) {
                        allDependencies.push(templateToInstall)
                    } else if (template) {
                        console.log('')
                        console.log(
                            `The ${chalk.cyan(packageInfo.name)} version you're using ${
                                packageInfo.name === 'react-scripts' ? 'is not' : 'may not be'
                            } compatible with the ${chalk.cyan('--template')} option.`
                        )
                        console.log('')
                    }

                    console.log(
                        `Installing ${chalk.cyan('react')}, ${chalk.cyan('react-dom')}, and ${chalk.cyan(packageInfo.name)}${
                            supportsTemplates ? ` with ${chalk.cyan(templateInfo.name)}` : ''
                        }...`
                    )
                    console.log()

                    return install(root, useYarn, usePnp, allDependencies, verbose, isOnline).then(() => ({
                        packageInfo,
                        supportsTemplates,
                        templateInfo
                    }))
                })
                .then(async ({ packageInfo, supportsTemplates, templateInfo }) => {
                    const packageName = packageInfo.name
                    const templateName = supportsTemplates ? templateInfo.name : undefined
                    checkNodeVersion(packageName)
                    setCaretRangeForRuntimeDeps(packageName)

                    const pnpPath = path.resolve(process.cwd(), '.pnp.js')

                    const nodeArgs = fs.existsSync(pnpPath) ? ['--require', pnpPath] : []

                    await executeNodeScript(
                        {
                            cwd: process.cwd(),
                            args: nodeArgs
                        },
                        [root, appName, verbose, originalDirectory, templateName],
                        `
          const init = require('${packageName}/scripts/init.js');
          init.apply(null, JSON.parse(process.argv[1]));
        `
                    )

                    if (version === 'react-scripts@0.9.x') {
                        console.log(
                            chalk.yellow(
                                `\nNote: the project was bootstrapped with an old unsupported version of tools.\n` +
                                    `Please update to Node >=14 and npm >=6 to get supported tools in new projects.\n`
                            )
                        )
                    }
                })
                .catch((reason) => {
                    console.log()
                    console.log('Aborting installation.')
                    if (reason.command) {
                        console.log(`  ${chalk.cyan(reason.command)} has failed.`)
                    } else {
                        console.log(chalk.red('Unexpected error. Please report it as a bug:'))
                        console.log(reason)
                    }
                    console.log()

                    // On 'exit' we will delete these files from target directory.
                    const knownGeneratedFiles = ['package.json', 'node_modules']
                    const currentFiles = fs.readdirSync(path.join(root))
                    currentFiles.forEach((file) => {
                        knownGeneratedFiles.forEach((fileToMatch) => {
                            // This removes all knownGeneratedFiles.
                            if (file === fileToMatch) {
                                console.log(`Deleting generated file... ${chalk.cyan(file)}`)
                                fs.removeSync(path.join(root, file))
                            }
                        })
                    })
                    const remainingFiles = fs.readdirSync(path.join(root))
                    if (!remainingFiles.length) {
                        // Delete target folder if empty
                        console.log(`Deleting ${chalk.cyan(`${appName}/`)} from ${chalk.cyan(path.resolve(root, '..'))}`)
                        process.chdir(path.resolve(root, '..'))
                        fs.removeSync(path.join(root))
                    }
                    console.log('Done.')
                    process.exit(1)
                })
        }
    )
}

function checkNpmVersion() {
    let hasMinNpm = false
    let npmVersion = null
    try {
        npmVersion = execSync('npm --version').toString().trim()
        hasMinNpm = semver.gte(npmVersion, '6.0.0')
    } catch (err) {
        // ignore
    }
    return {
        hasMinNpm: hasMinNpm,
        npmVersion: npmVersion
    }
}

function checkYarnVersion() {
    const minYarnPnp = '1.12.0'
    const maxYarnPnp = '2.0.0'
    let hasMinYarnPnp = false
    let hasMaxYarnPnp = false
    let yarnVersion = null
    try {
        yarnVersion = execSync('yarnpkg --version').toString().trim()
        if (semver.valid(yarnVersion)) {
            hasMinYarnPnp = semver.gte(yarnVersion, minYarnPnp)
            hasMaxYarnPnp = semver.lt(yarnVersion, maxYarnPnp)
        } else {
            // Handle non-semver compliant yarn version strings, which yarn currently
            // uses for nightly builds. The regex truncates anything after the first
            // dash. See #5362.
            const trimmedYarnVersionMatch = /^(.+?)[-+].+$/.exec(yarnVersion)
            if (trimmedYarnVersionMatch) {
                const trimmedYarnVersion = trimmedYarnVersionMatch.pop()
                hasMinYarnPnp = semver.gte(trimmedYarnVersion, minYarnPnp)
                hasMaxYarnPnp = semver.lt(trimmedYarnVersion, maxYarnPnp)
            }
        }
    } catch (err) {
        // ignore
    }
    return {
        hasMinYarnPnp: hasMinYarnPnp,
        hasMaxYarnPnp: hasMaxYarnPnp,
        yarnVersion: yarnVersion
    }
}

module.exports = {
    checkForLatestVersion,
    createApp
}
