/* Historical Axios packages are test fixtures only, never SDK dependencies. */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { runtimeChecks } = require('./test-http-compat-runtime.cjs')

const root = path.resolve(__dirname, '..')
const ts = require(
  process.env.HTTP_COMPAT_TYPESCRIPT ||
    path.join(root, 'node_modules/typescript')
)
const versions = (
  process.env.HTTP_COMPAT_VERSIONS ||
  '1.2.6,1.4.0,1.7.7,1.9.0,1.13.6,1.18.1,1.20.0'
).split(',')
const packages = JSON.parse(process.env.HTTP_COMPAT_PACKAGES || '{}')
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'onpage-http-compat-'))

async function main() {
  // Resolve native Axios from the SDK itself, independently of the foreign
  // consumer fixtures, and cover both class-field emit strategies.
  for (const useDefineForClassFields of [false, true]) {
    const program = ts.createProgram(
      [path.join(__dirname, 'http-compat-native.fixture.ts')],
      {
        strict: true,
        noEmit: true,
        skipLibCheck: false,
        esModuleInterop: true,
        useDefineForClassFields,
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        types: ['node'],
        typeRoots: [
          process.env.HTTP_COMPAT_TYPE_ROOT || path.join(root, 'node_modules/@types'),
        ],
        lib: ['lib.es2020.d.ts', 'lib.dom.d.ts'],
      }
    )
    const errors = ts.getPreEmitDiagnostics(program)
    if (errors.length) {
      throw new Error(ts.formatDiagnosticsWithColorAndContext(errors, {
        getCurrentDirectory: () => root,
        getCanonicalFileName: value => value,
        getNewLine: () => '\n',
      }))
    }
  }
  console.log(`Native subclass declarations passed (TS ${ts.version})`)
  for (const version of versions) {
    assert.match(version, /^\d+\.\d+\.\d+$/)
    const consumer = path.join(temp, version)
    const modules = path.join(consumer, 'node_modules')
    fs.mkdirSync(modules, { recursive: true })
    let source = packages[version]
    if (!source) {
      const packed = JSON.parse(
        execFileSync(
          'npm',
          [
            'pack',
            '--ignore-scripts',
            '--json',
            '--pack-destination',
            consumer,
            `axios@${version}`,
          ],
          { encoding: 'utf8' }
        )
      )
      execFileSync('tar', [
        '-xzf',
        path.join(consumer, packed[0].filename),
        '-C',
        consumer,
      ])
      source = path.join(consumer, 'package')
    }
    assert.equal(
      JSON.parse(fs.readFileSync(path.join(source, 'package.json'))).version,
      version
    )
    fs.cpSync(source, path.join(modules, 'axios'), { recursive: true })
    for (const name of fs.readdirSync(path.join(root, 'node_modules'))) {
      if (name === 'axios' || name === '.bin' || name === 'onpage-js') continue
      fs.symlinkSync(
        path.join(root, 'node_modules', name),
        path.join(modules, name),
        'dir'
      )
    }
    fs.symlinkSync(root, path.join(modules, 'onpage-js'), 'dir')
    const modes = [
      {
        name: 'legacy',
        module: ts.ModuleKind.CommonJS,
        resolution: ts.ModuleResolutionKind.NodeJs,
        extension: 'ts',
      },
      {
        name: 'node16',
        module: ts.ModuleKind.Node16,
        resolution: ts.ModuleResolutionKind.Node16,
        extension: 'cts',
      },
    ]
    if (ts.ModuleResolutionKind.Bundler !== undefined)
      modes.push({
        name: 'bundler',
        module: ts.ModuleKind.ESNext,
        resolution: ts.ModuleResolutionKind.Bundler,
        extension: 'mts',
      })
    for (const mode of modes) {
      const fixture = path.join(consumer, `consumer.${mode.extension}`)
      fs.copyFileSync(path.join(__dirname, 'http-compat.fixture.ts'), fixture)
      const program = ts.createProgram([fixture], {
        strict: true,
        noEmit: true,
        skipLibCheck: false,
        esModuleInterop: true,
        target: ts.ScriptTarget.ES2020,
        module: mode.module,
        moduleResolution: mode.resolution,
        types: ['node'],
        typeRoots: [
          process.env.HTTP_COMPAT_TYPE_ROOT ||
            path.join(root, 'node_modules/@types'),
        ],
        lib: ['lib.es2020.d.ts', 'lib.dom.d.ts'],
      })
      const errors = ts.getPreEmitDiagnostics(program)
      if (errors.length) {
        throw new Error(
          `${version}, ${mode.name}:\n` +
            ts.formatDiagnosticsWithColorAndContext(errors, {
              getCurrentDirectory: () => consumer,
              getCanonicalFileName: value => value,
              getNewLine: () => '\n',
            })
        )
      }
    }
    await runtimeChecks(root, consumer, version)
    console.log(
      `Axios ${version}: ${modes.length} module modes (TS ${ts.version}) and offline requests passed`
    )
  }
}
main()
  .then(() => fs.rmSync(temp, { recursive: true, force: true }))
  .catch(error => {
    console.error(error)
    console.error(`Fixtures retained at ${temp}`)
    process.exitCode = 1
  })
