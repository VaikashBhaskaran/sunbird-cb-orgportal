
import { ActivatedRoute, Router } from '@angular/router'
import { LeftMenuComponent } from './left-menu.component'

describe('LeftMenuComponent', () => {
    let component: LeftMenuComponent

    const activatedRoute: Partial<ActivatedRoute> = {}
    const router: Partial<Router> = {}

    beforeAll(() => {
        component = new LeftMenuComponent(
            activatedRoute as ActivatedRoute,
            router as Router,
            // Added since this spec was written; inert stand-ins.
            { open: jest.fn() } as any,
            { open: jest.fn() } as any,
            { raiseInteractTelemetry: jest.fn() } as any
        )
    })

    beforeEach(() => {
        jest.clearAllMocks()
        jest.resetAllMocks()
    })

    it('should create a instance of component', () => {
        expect(component).toBeTruthy()
    })
})
