import { UsersCardComponent } from './users-card.component'
import { MatDialog } from '@angular/material/dialog'
import { DialogConfirmComponent } from '../../../../../../../../../src/app/component/dialog-confirm/dialog-confirm.component'
import { ViewReportDialogComponent } from '../view-report-dialog/view-report-dialog.component'
import { RejectReasonDialogComponent } from '../reject-reason-dialog/reject-reason-dialog.component'
import { of } from 'rxjs'

describe('UsersCardComponent', () => {
    let component: UsersCardComponent
    let matDialogMock: jest.Mocked<MatDialog>
    let userClickSpy: jest.Mock
    let showUserSpy: jest.Mock

    // Mock MatDialogRef with necessary properties
    const matDialogRefMock = {
        afterClosed: jest.fn().mockReturnValue(of(true)),
    } as unknown as any

    beforeEach(() => {
        // Mock MatDialog and ensure it returns a mocked MatDialogRef
        matDialogMock = {
            open: jest.fn().mockReturnValue(matDialogRefMock), // Return the mock for dialogRef
        } as any // Cast as MatDialog

        // Mock EventEmitter
        userClickSpy = jest.fn()
        showUserSpy = jest.fn()

        component = new UsersCardComponent(matDialogMock)

        // Assigning mocked EventEmitters to the component
        component.userClick = { emit: userClickSpy } as any
        component.showUser = { emit: showUserSpy } as any
    })

    it('should be created', () => {
        expect(component).toBeTruthy()
    })

    describe('clickApprove', () => {
        it('should open the DialogConfirmComponent and emit user data on confirmation', () => {
            component.user = { userInfo: { first_name: 'John' } }
            component.clickApprove()

            expect(matDialogMock.open).toHaveBeenCalledWith(DialogConfirmComponent, {
                data: {
                    title: 'Are you sure?',
                    body: 'Please click <strong>Yes</strong> to approve this request.',
                },
            })
            expect(userClickSpy).toHaveBeenCalledWith({
                action: 'Approve',
                userData: component.user,
            })
        })

        it('should not emit anything if dialog is closed without confirmation', () => {
            matDialogRefMock.afterClosed.mockReturnValue(of(false)) // Simulate cancel behavior
            component.clickApprove()

            expect(userClickSpy).not.toHaveBeenCalled()
        })
    })

    describe('clickReject', () => {
        it('should open RejectReasonDialogComponent and emit user data with comment on confirmation', () => {
            component.user = { first_name: 'Jane' }
            matDialogRefMock.afterClosed.mockReturnValue(of({ reason: 'Some reason' }))

            component.clickReject()

            expect(matDialogMock.open).toHaveBeenCalledWith(RejectReasonDialogComponent, {
                width: '950px',
                disableClose: true,
                data: {
                    title: 'Please provide the reason for rejecting the user from the batch',
                    buttonText: 'Reject',
                },
            })

            expect(userClickSpy).toHaveBeenCalledWith({
                action: 'Reject',
                userData: component.user,
                comment: 'Some reason',
            })
        })

        it('should not emit anything if dialog is closed without reason', () => {
            matDialogRefMock.afterClosed.mockReturnValue(of(null)) // Simulate no reason entered
            component.clickReject()

            expect(userClickSpy).not.toHaveBeenCalled()
        })
    })

    describe('clickRemove', () => {
        it('should open RejectReasonDialogComponent and emit user data with comment on confirmation', () => {
            component.user = { first_name: 'Jake' }
            matDialogRefMock.afterClosed.mockReturnValue(of({ reason: 'Remove reason' }))

            component.clickRemove()

            expect(matDialogMock.open).toHaveBeenCalledWith(RejectReasonDialogComponent, {
                width: '950px',
                disableClose: true,
                data: {
                    title: 'Please provide the reason for removing the user from the batch',
                    buttonText: 'Remove',
                },
            })

            expect(userClickSpy).toHaveBeenCalledWith({
                action: 'Remove',
                userData: component.user,
                comment: 'Remove reason',
            })
        })

        it('should not emit anything if dialog is closed without reason', () => {
            matDialogRefMock.afterClosed.mockReturnValue(of(null)) // Simulate no reason entered
            component.clickRemove()

            expect(userClickSpy).not.toHaveBeenCalled()
        })
    })

    describe('loadUser', () => {
        it('should emit user data through showUser EventEmitter', () => {
            const user = { id: 1, name: 'John Doe' }
            // loadUser parks the user on programData before emitting, so that input has to
            // be bound.
            component.programData = {}
            component.loadUser(user)

            expect(component.programData.user).toBe(user)

            expect(showUserSpy).toHaveBeenCalledWith(user)
        })
    })

    describe('checkForSurveyLink', () => {
        it('should set isViewReport to true if conditions are met', () => {
            component.type = 'newRequest'
            component.contentData = { wfSurveyLink: 'surveys/12345' }
            component.user = { userInfo: { wid: '67890' } }

            component.checkForSurveyLink()

            expect(component.isViewReport).toBe(true)
            expect(component.viewReportData).toEqual({
                userId: '67890',
                formId: '12345',
            })
        })

        it('should not set isViewReport to true if conditions are not met', () => {
            component.type = 'oldRequest'
            component.contentData = { wfSurveyLink: 'surveys/12345' }
            component.user = { userInfo: { wid: '67890' } }

            component.checkForSurveyLink()

            expect(component.isViewReport).toBe(false)
        })
    })

    describe('openReportDialog', () => {
        it('should open the ViewReportDialogComponent', () => {
            component.viewReportData = { userId: '1', formId: '123' }
            component.openReportDialog()

            expect(matDialogMock.open).toHaveBeenCalledWith(ViewReportDialogComponent, {
                data: component.viewReportData,
                autoFocus: false,
                width: '920px',
            })
        })
    })

    describe('canDisableRemoveLink', () => {
        it('should return true if approvalType is "oneStepPCApproval"', () => {
            component.programData = { approvalType: 'oneStepPCApproval' }

            expect(component.canDisableRemoveLink()).toBe(true)
        })

        it('should return false if approvalType is not "oneStepPCApproval"', () => {
            component.programData = { approvalType: 'someOtherType' }

            expect(component.canDisableRemoveLink()).toBe(false)
        })
    })
})
