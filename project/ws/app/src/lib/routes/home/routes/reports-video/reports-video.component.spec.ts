import { MatDialogRef } from '@angular/material/dialog'
import { ReportsVideoComponent } from './reports-video.component'

describe('ReportsVideoComponent', () => {
    let component: ReportsVideoComponent

    const dialogRef: Partial<MatDialogRef<ReportsVideoComponent>> = {}
    const dialogData: any = {}

    beforeAll(() => {
        component = new ReportsVideoComponent(
            dialogRef as MatDialogRef<ReportsVideoComponent>,
            dialogData as undefined,
            // The component's DomSanitizer dependency is commented out.
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