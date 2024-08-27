const fs = require('fs-extra')
const https = require('https')
const path = require('path')
const semver = require('semver')
const chalk = require('chalk')
const os = require('os')
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

    // const originalDirectory = process.cwd()
    // process.chdir(root)
    // if (!useYarn && !checkThatNpmCanReadCwd()) {
    //     process.exit(1)
    // }

    // if (!useYarn) {
    //     const npmInfo = checkNpmVersion()
    //     if (!npmInfo.hasMinNpm) {
    //         if (npmInfo.npmVersion) {
    //             console.log(
    //                 chalk.yellow(
    //                     `You are using npm ${npmInfo.npmVersion} so the project will be bootstrapped with an old unsupported version of tools.\n\n` +
    //                         `Please update to npm 6 or higher for a better, fully supported experience.\n`
    //                 )
    //             )
    //         }
    //         // Fall back to latest supported react-scripts for npm 3
    //         version = 'react-scripts@0.9.x'
    //     }
    // } else if (usePnp) {
    //     const yarnInfo = checkYarnVersion()
    //     if (yarnInfo.yarnVersion) {
    //         if (!yarnInfo.hasMinYarnPnp) {
    //             console.log(
    //                 chalk.yellow(
    //                     `You are using Yarn ${yarnInfo.yarnVersion} together with the --use-pnp flag, but Plug'n'Play is only supported starting from the 1.12 release.\n\n` +
    //                         `Please update to Yarn 1.12 or higher for a better, fully supported experience.\n`
    //                 )
    //             )
    //             // 1.11 had an issue with webpack-dev-middleware, so better not use PnP with it (never reached stable, but still)
    //             usePnp = false
    //         }
    //         if (!yarnInfo.hasMaxYarnPnp) {
    //             console.log(
    //                 chalk.yellow(
    //                     'The --use-pnp flag is no longer necessary with yarn 2 and will be deprecated and removed in a future release.\n'
    //                 )
    //             )
    //             // 2 supports PnP by default and breaks when trying to use the flag
    //             usePnp = false
    //         }
    //     }
    // }

    // run(root, appName, version, verbose, originalDirectory, template, useYarn, usePnp)
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

module.exports = {
    checkForLatestVersion,
    createApp
}
