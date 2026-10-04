import { AssistantContentCardComponent } from './assistant-content-card.component'
import { MatDialog } from '@angular/material/dialog'
import { PlayerDialogComponent } from '../player-dialog/player-dialog.component'
import { of } from 'rxjs'

// Mocking MatDialog and PlayerDialogComponent
jest.mock('@angular/material/dialog', () => ({
    MatDialog: jest.fn().mockImplementation(() => ({
        open: jest.fn(),
    })),
}))

describe('AssistantContentCardComponent', () => {
    let component: AssistantContentCardComponent
    let dialogMock: MatDialog

    beforeEach(() => {
        dialogMock = new MatDialog(null as any, null as any, null as any, null as any, null as any, null as any, null as any)
        component = new AssistantContentCardComponent(dialogMock)
        component.content = { key: 'value' } // Example of setting the content input
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should call MatDialog open with correct parameters when openDialog is called', () => {
        const openSpy = jest.spyOn(dialogMock, 'open').mockReturnValue({
            afterClosed: jest.fn().mockReturnValue(of(null)), // Return a mocked observable here
        } as any) // Casting to 'any' to avoid type issues

        component.openDialog()

        expect(openSpy).toHaveBeenCalledWith(PlayerDialogComponent, {
            restoreFocus: false,
            disableClose: false,
            data: component.content,
            width: '70%',
            maxHeight: '80vh',
            maxWidth: '80%',
        })
    })

    it('should subscribe to afterClosed observable', () => {
        const afterClosedMock = jest.fn().mockReturnValue(of(null))
        // open() is auto-mocked and returns undefined by default, so the dialog ref has to
        // be supplied here or openDialog has nothing to call afterClosed on.
        jest.spyOn(dialogMock, 'open').mockReturnValue({
            afterClosed: afterClosedMock,
        } as any)

        component.openDialog()

        expect(afterClosedMock).toHaveBeenCalled()
    })
})
