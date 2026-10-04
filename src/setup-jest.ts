import 'jest-preset-angular/setup-jest'
Object.defineProperty(window, 'env', {
  value: {
    sitePath: 'http://example.com',
    karmYogiPath: 'http://karmyogi.example.com',
    portalRoles: 'admin,user',
    name: 'Test Environment',
    cbpProvidersRoles: [],
    userBucket: 'test-bucket',
    departments: ['HR', 'Finance'],
    contentHost: 'http://content.example.com',
    azureBucket: 'test-azure-bucket',
    spvPath: 'http://spv.example.com',
    connectionType: 'online',
    KCMframeworkName: 'Framework 1',
  },
  writable: true,
})
// The real environment.ts reads every field off window.env but falls back to an empty
// string, zero, false or an empty collection, so nothing is ever undefined. This mirrors
// that shape with those same inert defaults: components reach for things like
// environment.azureHost inside subscriptions, and an undefined there throws in a way that
// escapes jest and takes the worker down with it.
jest.mock('src/environments/environment', () => ({
  environment: {
    production: false,
    name: '',
    sitePath: '',
    karmYogiPath: '',
    cbpPath: '',
    portalRoles: [],
    contentHost: '',
    contentBucket: '',
    userBucket: '',
    domainName: '',
    mdoPath: '',
    resendOTPTIme: 120,
    teamsUrl: '',
    connectionType: '',
    KCMframeworkName: '',
    ODCSMasterFramework: '',
    compentencyVersionKey: '',
    doptOrg: '',
    dicussV2Bucket: '',
    portalsForNotifications: {},
    debug: false,
    googleStorageUrl: '',
    mdoChannelsBookmarkId: '',
    spvorgID: '',
    azureHost: '',
    azureBucket: '',
    azureOldHost: '',
    azureOldBuket: '',
    assessmentBuffer: 0,
    quizResultTimeout: 0,
    publicContentSurveyId: 0,
  }
}))