
import { OrgUserService } from '../../services/org-user.service'
// The component takes ContentBatchService; content-detail.service and its
// MyContentService no longer exist.
import { ContentBatchService } from '../../services/content-batch.service'
import { MatDialog } from '@angular/material/dialog'
import { SelectLearnersToBatchComponent } from './select-learners-to-batch.component'

describe('SelectLearnersToBatchComponent', () => {
    let component: SelectLearnersToBatchComponent

    const orgSvc: Partial<OrgUserService> = {}
    const dialog: Partial<MatDialog> = {}
    const contentSvc: Partial<ContentBatchService> = {}

    beforeAll(() => {
        component = new SelectLearnersToBatchComponent(
            orgSvc as OrgUserService,
            dialog as MatDialog,
            contentSvc as ContentBatchService
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
