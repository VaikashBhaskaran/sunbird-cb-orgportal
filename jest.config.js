// project/ws/app/src/lib/routes/app-toc is largely unreachable code: only 7 of its 82
// source files are imported from src/main.ts, and AppTocModule itself is referenced
// nowhere, so the components/, routes/ and resolvers/ subtrees and the two root modules
// ship in no bundle. Their specs are excluded from both the test run and the coverage
// denominator so the numbers describe code that actually ships. The live parts of
// app-toc - models/, services/ and share-toc/, which the routed ViewerModule imports -
// deliberately stay in scope.
//
// To verify the reachability claim before changing this list:
//   npx tsc -p tsconfig.app.json --listFilesOnly | grep /app-toc/
const UNREACHABLE_APP_TOC = [
  '/routes/app-toc/components/',
  '/routes/app-toc/routes/',
  '/routes/app-toc/resolvers/',
  '/routes/app-toc/app-toc\\.module\\.ts$',
  '/routes/app-toc/app-toc-routing\\.module\\.ts$',
]

// Two more files that ship in no bundle and no longer type-check against their current
// dependencies, so their specs cannot even compile:
//   dynamic-assets-loader.service.ts - fromEvent's boolean|undefined return
//   widget-content-share.service.ts  - imports ICommon, which @sunbird-cb/collection
//                                      declares but does not export
// Verify with: npx tsc -p tsconfig.app.json --listFilesOnly | grep <name>
const UNREACHABLE_SERVICES = [
  '/head/_services/dynamic-assets-loader\\.service',
  '/head/_services/widget-content-share\\.service',
  // viewer/resolvers/config-resolver.service.ts declares it returns Observable<IConfig>
  // but returns Observable<IResolveResponse<IConfig>>.
  '/viewer/src/lib/resolvers/config-resolver\\.service',
  // viewer/routes/offline-session imports '@sunbird-cb/toc/lib/services/...', a deep path
  // the package does not expose. See entry 4 in product-bugs.md - moot while the file
  // ships in no bundle, but it is why this spec cannot compile.
  '/viewer/src/lib/routes/offline-session/',
]

module.exports = {
  preset: 'jest-preset-angular',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setup-jest.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!.*\\.mjs$)',
  ],
  moduleNameMapper: {
    'worker-loader!.*': '<rootDir>/test/mocks/workerMock.js',
    'pdfjs-dist/build/pdf.worker': '<rootDir>/test/mocks/workerMock.js',
    // ckeditor5 is native ESM; jest's CJS runtime cannot require it.
    '^ckeditor5$': '<rootDir>/test/mocks/emptyStub.js',
    // Imported by source files but not part of this repository. See test/types/stubs.d.ts.
    '^@ws-widget/.*$': '<rootDir>/test/mocks/emptyStub.js',
    '^@ws/author(/.*)?$': '<rootDir>/test/mocks/emptyStub.js',
    // Mirrors the "@ws/*" paths in tsconfig.json. Without these, source files that import
    // across the two projects type-check but fail to resolve at run time under jest.
    '^@ws/app/(.*)$': '<rootDir>/project/ws/app/$1',
    '^@ws/viewer/(.*)$': '<rootDir>/project/ws/viewer/$1',
    // Shared spec helpers, so deeply nested specs need no ../../.. chains.
    '^@test/(.*)$': '<rootDir>/test/$1',
    "^src/environments/environment$": "<rootDir>/src/environments/environment.ts",
    // tsconfig sets baseUrl: "./", so source files can import from the repo root -
    // 'src/app/guards/general.guard', 'project/ws/viewer/.../resource-collection.service'.
    // jest resolves from node_modules only, so mirror that here. The environment entry
    // above stays first: moduleNameMapper takes the first pattern that matches.
    "^src/(.*)$": "<rootDir>/src/$1",
    "^project/(.*)$": "<rootDir>/project/$1",
    "uuid": require.resolve('uuid'),
  },
  // src/test.ts and its two siblings are karma entry points: they call
  // getTestBed().initTestEnvironment(), which setup-jest.ts has already done, so running
  // them as suites fails with "Cannot set base providers because it has already been
  // called". They match jest's default testMatch only because of the "test.ts" filename.
  // angular.json still names them as the karma `test` targets, so they stay on disk.
  testPathIgnorePatterns: ['/node_modules/', '/src/test\\.ts$', ...UNREACHABLE_APP_TOC, ...UNREACHABLE_SERVICES],
  coveragePathIgnorePatterns: ['/node_modules/', ...UNREACHABLE_APP_TOC, ...UNREACHABLE_SERVICES],
  coverageReporters: ["clover", "json", "lcov", "text", "text-summary"],
  collectCoverage: true,
  testResultsProcessor: "jest-sonar-reporter",
  // @angular/localize/init defines the global $localize that @sunbird-cb/* packages
  // call at runtime; without it those specs die with "$localize is not defined".
  setupFiles: ['zone.js', '@angular/localize/init']
}
