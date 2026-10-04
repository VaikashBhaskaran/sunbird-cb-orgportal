import { ActivatedRoute, Router } from '@angular/router'
import { BlendedService } from '../../services/blended.service'
import { BlendedApprovalsComponent } from './blended-approvals.component'

describe('BlendedApprovalsComponent', () => {
    let component: BlendedApprovalsComponent

    const activeRouter: Partial<ActivatedRoute> = {}
    const router: Partial<Router> = {}
    const bpService: Partial<BlendedService> = {}

    beforeAll(() => {
        component = new BlendedApprovalsComponent(
            activeRouter as ActivatedRoute,
            router as Router,
            bpService as BlendedService,
            // Only changeLoaderState is called, and only for its side effect.
            { changeLoaderState: jest.fn() } as any
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
