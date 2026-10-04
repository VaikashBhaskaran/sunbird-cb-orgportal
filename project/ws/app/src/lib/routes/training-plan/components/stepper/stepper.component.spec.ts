
import { ActivatedRoute } from '@angular/router'
import { TrainingPlanDataSharingService } from '../../services/training-plan-data-share.service'
import { StepperComponent } from './stepper.component'

describe('StepperComponent', () => {
    let component: StepperComponent

    const route: Partial<ActivatedRoute> = {}
    const tpdsSvc: Partial<TrainingPlanDataSharingService> = {}

    beforeAll(() => {
        component = new StepperComponent(
            route as ActivatedRoute,
            tpdsSvc as TrainingPlanDataSharingService,
            // Added since this spec was written. DestroyRef only has to satisfy
            // takeUntilDestroyed, which registers a teardown callback on it.
            { createUserGroup: jest.fn(), updateUserGroup: jest.fn() } as any,
            { onDestroy: jest.fn() } as any
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