import { AICBPRequestComponent } from './ai-cbp-request.component'

describe('AICBPRequestComponent', () => {
  let component: AICBPRequestComponent
  let router: any

  beforeEach(() => {
    router = { navigate: jest.fn() }
    component = new AICBPRequestComponent(router)
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should survive ngOnInit', () => {
    expect(() => component.ngOnInit()).not.toThrow()
  })
})
