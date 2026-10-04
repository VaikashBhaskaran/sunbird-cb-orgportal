import { LoginRootDirective } from './login-root.directive'

describe('LoginRootDirective', () => {
  it('should create an instance', () => {
    const directive = new LoginRootDirective({} as any)   // ViewContainerRef, only held as a field
    expect(directive).toBeTruthy()
  })
})
