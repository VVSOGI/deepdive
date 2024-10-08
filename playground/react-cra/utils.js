const fs = require('fs-extra')
const https = require('https')
const path = require('path')
const semver = require('semver')
const chalk = require('chalk')
const os = require('os')
const spawn = require('cross-spawn')
const execSync = require('child_process').execSync
const prompts = require('prompts')
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
            console.log(packageToInstall, templateToInstall)

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
                    const supportsTemplates = semver.gte(packageVersion, templatesVersionMinimum)
                    // Only support templates when used alongside new react-scripts versions.
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
                    const knownGeneratedFiles = ['package.json', 'package-lock.json', 'node_modules']
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

function install(root, useYarn, usePnp, dependencies, verbose, isOnline) {
    return new Promise((resolve, reject) => {
        let command
        let args
        if (useYarn) {
            command = 'yarnpkg'
            args = ['add', '--exact']
            if (!isOnline) {
                args.push('--offline')
            }
            if (usePnp) {
                args.push('--enable-pnp')
            }
            ;[].push.apply(args, dependencies)

            // Explicitly set cwd() to work around issues like
            // https://github.com/facebook/create-react-app/issues/3326.
            // Unfortunately we can only do this for Yarn because npm support for
            // equivalent --prefix flag doesn't help with this issue.
            // This is why for npm, we run checkThatNpmCanReadCwd() early instead.
            args.push('--cwd')
            args.push(root)

            if (!isOnline) {
                console.log(chalk.yellow('You appear to be offline.'))
                console.log(chalk.yellow('Falling back to the local Yarn cache.'))
                console.log()
            }
        } else {
            command = 'npm'
            args = [
                'install',
                '--no-audit', // https://github.com/facebook/create-react-app/issues/11174
                '--save',
                '--save-exact',
                '--loglevel',
                'error'
            ].concat(dependencies)

            if (usePnp) {
                console.log(chalk.yellow("NPM doesn't support PnP."))
                console.log(chalk.yellow('Falling back to the regular installs.'))
                console.log()
            }
        }

        if (verbose) {
            args.push('--verbose')
        }

        const child = spawn(command, args, { stdio: 'inherit' })
        child.on('close', (code) => {
            if (code !== 0) {
                reject({
                    command: `${command} ${args.join(' ')}`
                })
                return
            }
            resolve()
        })
    })
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

function getInstallPackage(version, originalDirectory) {
    let packageToInstall = 'react-scripts'
    const validSemver = semver.valid(version)
    if (validSemver) {
        packageToInstall += `@${validSemver}`
    } else if (version) {
        if (version[0] === '@' && !version.includes('/')) {
            packageToInstall += version
        } else if (version.match(/^file:/)) {
            packageToInstall = `file:${path.resolve(originalDirectory, version.match(/^file:(.*)?$/)[1])}`
        } else {
            // for tar.gz or alternative paths
            packageToInstall = version
        }
    }

    const scriptsToWarn = [
        {
            name: 'react-scripts-ts',
            message: chalk.yellow(
                `The react-scripts-ts package is deprecated. TypeScript is now supported natively in Create React App. You can use the ${chalk.green(
                    '--template typescript'
                )} option instead when generating your app to include TypeScript support. Would you like to continue using react-scripts-ts?`
            )
        }
    ]

    for (const script of scriptsToWarn) {
        if (packageToInstall.startsWith(script.name)) {
            return prompts({
                type: 'confirm',
                name: 'useScript',
                message: script.message,
                initial: false
            }).then((answer) => {
                if (!answer.useScript) {
                    process.exit(0)
                }

                return packageToInstall
            })
        }
    }

    return Promise.resolve(packageToInstall)
}

function getTemplateInstallPackage(template, originalDirectory) {
    let templateToInstall = 'cra-template'
    if (template) {
        if (template.match(/^file:/)) {
            templateToInstall = `file:${path.resolve(originalDirectory, template.match(/^file:(.*)?$/)[1])}`
        } else if (template.includes('://') || template.match(/^.+\.(tgz|tar\.gz)$/)) {
            // for tar.gz or alternative paths
            templateToInstall = template
        } else {
            // Add prefix 'cra-template-' to non-prefixed templates, leaving any
            // @scope/ and @version intact.
            const packageMatch = template.match(/^(@[^/]+\/)?([^@]+)?(@.+)?$/)
            const scope = packageMatch[1] || ''
            const templateName = packageMatch[2] || ''
            const version = packageMatch[3] || ''

            if (templateName === templateToInstall || templateName.startsWith(`${templateToInstall}-`)) {
                // Covers:
                // - cra-template
                // - @SCOPE/cra-template
                // - cra-template-NAME
                // - @SCOPE/cra-template-NAME
                templateToInstall = `${scope}${templateName}${version}`
            } else if (version && !scope && !templateName) {
                // Covers using @SCOPE only
                templateToInstall = `${version}/${templateToInstall}`
            } else {
                // Covers templates without the `cra-template` prefix:
                // - NAME
                // - @SCOPE/NAME
                templateToInstall = `${scope}${templateToInstall}-${templateName}${version}`
            }
        }
    }

    return Promise.resolve(templateToInstall)
}

function checkIfOnline(useYarn) {
    if (!useYarn) {
        // Don't ping the Yarn registry.
        // We'll just assume the best case.
        return Promise.resolve(true)
    }

    return new Promise((resolve) => {
        dns.lookup('registry.yarnpkg.com', (err) => {
            let proxy
            if (err != null && (proxy = getProxy())) {
                // If a proxy is defined, we likely can't resolve external hostnames.
                // Try to resolve the proxy name as an indication of a connection.
                dns.lookup(url.parse(proxy).hostname, (proxyErr) => {
                    resolve(proxyErr == null)
                })
            } else {
                resolve(err == null)
            }
        })
    })
}

function getPackageInfo(installPackage) {
    if (installPackage.match(/^.+\.(tgz|tar\.gz)$/)) {
        return getTemporaryDirectory()
            .then((obj) => {
                let stream
                if (/^http/.test(installPackage)) {
                    stream = hyperquest(installPackage)
                } else {
                    stream = fs.createReadStream(installPackage)
                }
                return extractStream(stream, obj.tmpdir).then(() => obj)
            })
            .then((obj) => {
                const { name, version } = require(path.join(obj.tmpdir, 'package.json'))
                obj.cleanup()
                return { name, version }
            })
            .catch((err) => {
                // The package name could be with or without semver version, e.g. react-scripts-0.2.0-alpha.1.tgz
                // However, this function returns package name only without semver version.
                console.log(`Could not extract the package name from the archive: ${err.message}`)
                const assumedProjectName = installPackage.match(/^.+\/(.+?)(?:-\d+.+)?\.(tgz|tar\.gz)$/)[1]
                console.log(`Based on the filename, assuming it is "${chalk.cyan(assumedProjectName)}"`)
                return Promise.resolve({ name: assumedProjectName })
            })
    } else if (installPackage.startsWith('git+')) {
        // Pull package name out of git urls e.g:
        // git+https://github.com/mycompany/react-scripts.git
        // git+ssh://github.com/mycompany/react-scripts.git#v1.2.3
        return Promise.resolve({
            name: installPackage.match(/([^/]+)\.git(#.*)?$/)[1]
        })
    } else if (installPackage.match(/.+@/)) {
        // Do not match @scope/ when stripping off @version or @tag
        return Promise.resolve({
            name: installPackage.charAt(0) + installPackage.substr(1).split('@')[0],
            version: installPackage.split('@')[1]
        })
    } else if (installPackage.match(/^file:/)) {
        const installPackagePath = installPackage.match(/^file:(.*)?$/)[1]
        const { name, version } = require(path.join(installPackagePath, 'package.json'))
        return Promise.resolve({ name, version })
    }
    return Promise.resolve({ name: installPackage })
}

function checkNodeVersion(packageName) {
    const packageJsonPath = path.resolve(process.cwd(), 'node_modules', packageName, 'package.json')

    if (!fs.existsSync(packageJsonPath)) {
        return
    }

    const packageJson = require(packageJsonPath)
    if (!packageJson.engines || !packageJson.engines.node) {
        return
    }

    if (!semver.satisfies(process.version, packageJson.engines.node)) {
        console.error(
            chalk.red(
                'You are running Node %s.\n' + 'Create React App requires Node %s or higher. \n' + 'Please update your version of Node.'
            ),
            process.version,
            packageJson.engines.node
        )
        process.exit(1)
    }
}

function setCaretRangeForRuntimeDeps(packageName) {
    const packagePath = path.join(process.cwd(), 'package.json')
    const packageJson = require(packagePath)

    if (typeof packageJson.dependencies === 'undefined') {
        console.error(chalk.red('Missing dependencies in package.json'))
        process.exit(1)
    }

    const packageVersion = packageJson.dependencies[packageName]
    if (typeof packageVersion === 'undefined') {
        console.error(chalk.red(`Unable to find ${packageName} in package.json`))
        process.exit(1)
    }

    makeCaretRange(packageJson.dependencies, 'react')
    makeCaretRange(packageJson.dependencies, 'react-dom')

    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + os.EOL)
}

function executeNodeScript({ cwd, args }, data, source) {
    return new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [...args, '-e', source, '--', JSON.stringify(data)], { cwd, stdio: 'inherit' })

        child.on('close', (code) => {
            if (code !== 0) {
                reject({
                    command: `node ${args.join(' ')}`
                })
                return
            }
            resolve()
        })
    })
}

function makeCaretRange(dependencies, name) {
    const version = dependencies[name]

    if (typeof version === 'undefined') {
        console.error(chalk.red(`Missing ${name} dependency in package.json`))
        process.exit(1)
    }

    let patchedVersion = `^${version}`

    if (!semver.validRange(patchedVersion)) {
        console.error(
            `Unable to patch ${name} dependency version because version ${chalk.red(version)} will become invalid ${chalk.red(
                patchedVersion
            )}`
        )
        patchedVersion = version
    }

    dependencies[name] = patchedVersion
}

module.exports = {
    checkForLatestVersion,
    createApp
}
