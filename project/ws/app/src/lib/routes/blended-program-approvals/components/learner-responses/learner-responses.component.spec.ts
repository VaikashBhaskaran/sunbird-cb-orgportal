import { LearnerResponsesComponent } from './learner-responses.component'
import { BlendedApporvalService } from '../../services/blended-approval.service'
import { MatDialog } from '@angular/material/dialog'
import { RejectReasonDialogComponent } from '../reject-reason-dialog/reject-reason-dialog.component'
import { DialogConfirmComponent } from '../../../../../../../../../src/app/component/dialog-confirm/dialog-confirm.component'
import { of } from 'rxjs'
import _ from 'lodash'

jest.mock('../../services/blended-approval.service')
jest.mock('@angular/material/dialog')

describe('LearnerResponsesComponent', () => {
    let component: LearnerResponsesComponent
    let bpService: jest.Mocked<BlendedApporvalService>
    let dialog: jest.Mocked<MatDialog>

    beforeEach(() => {
        // Mocking dependencies
        bpService = new BlendedApporvalService(null as any) as jest.Mocked<BlendedApporvalService>
        dialog = new MatDialog(null as any, null as any, null as any, null as any, null as any, null as any, null as any, null as any) as jest.Mocked<MatDialog>

        // jest.mock auto-mocks the service, so every method returns undefined by default.
        // ngOnInit subscribes to / awaits these, so they need to emit something.
        bpService.getUserById = jest.fn().mockReturnValue(of({})) as any
        bpService.getSurveyByUserID = jest.fn().mockReturnValue(of({ result: {} })) as any
        bpService.getSurveyByFormId = jest.fn().mockReturnValue(of({ result: {} })) as any
        bpService.getSubmissionsByUserId = jest.fn().mockReturnValue(of({ result: {} })) as any

        // Create component instance with mock dependencies
        component = new LearnerResponsesComponent(bpService, dialog)

        // Mocking the data inputs
        component.selectedUser = { wfInfo: [{ userId: 123, currentStatus: 'SEND_FOR_MDO_APPROVAL' }] }
        component.contentData = { wfSurveyLink: 'https://example.com/surveys/123' }
        component.batchData = {
            batchAttributes: {
                profileSurveyLink: 'https://example.com/surveys/123',
                bpEnrolMandatoryProfileFields: [{ field: 'profileDetails.professionalDetails.group' }]
            }
        }
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize correctly in ngOnInit', () => {
        const fetchLearnerSpy = jest.spyOn(component, 'fetchLearner')
        const getFormByIdSpy = jest.spyOn(component, 'getFormById')
        const getGroupAndDesignationFromSurevyFormSpy = jest.spyOn(component, 'getGroupAndDesignationFromSurevyForm')

        component.ngOnInit()

        expect(fetchLearnerSpy).toHaveBeenCalled()
        expect(getFormByIdSpy).toHaveBeenCalled()
        expect(getGroupAndDesignationFromSurevyFormSpy).toHaveBeenCalled()
    })

    it('should fetch learner data on fetchLearner', () => {
        const mockUserData = { profileDetails: { employmentDetails: { departmentName: 'IT' }, professionalDetails: [{ designation: 'Software Engineer' }] }, avatar: 'profile.jpg', firstName: 'John', email: 'john@example.com', userId: 123 }
        const getUserByIdMock = jest.spyOn(bpService, 'getUserById').mockReturnValue(of(mockUserData))

        // userId is read off selectedUser in ngOnInit; fetchLearner is called directly here.
        component.userId = 123

        component.fetchLearner()

        expect(getUserByIdMock).toHaveBeenCalledWith(123)
        // profileLink is '#' because getProfileLink is handed res.profileDetails rather
        // than res, and only res carries userId. Recorded in product-bugs.md.
        expect(component.learner).toEqual({
            department: 'IT',
            profileImage: 'profile.jpg',
            name: 'John',
            authorType: '',
            email: 'john@example.com',
            profileLink: '#',
            userId: 123,
            designation: 'Software Engineer'
        })
    })

    it('should call onReject and emit data', () => {
        const dialogRefMock = { afterClosed: jest.fn().mockReturnValue(of({ reason: 'Not qualified' })) }
        const openMock = jest.spyOn(dialog, 'open').mockReturnValue(dialogRefMock as any)
        const emitSpy = jest.spyOn(component.actionClick, 'emit')

        component.onReject()

        expect(openMock).toHaveBeenCalledWith(RejectReasonDialogComponent, {
            disableClose: true,
            data: {
                title: 'Please provide the reason for rejecting the user from the batch',
                buttonText: 'Reject'
            }
        })

        dialogRefMock.afterClosed().subscribe(() => {
            expect(emitSpy).toHaveBeenCalledWith({
                action: 'Reject',
                userData: component.selectedUser,
                comment: 'Not qualified'
            })
        })
    })

    it('should call onApprove and emit data', () => {
        const dialogRefMock = { afterClosed: jest.fn().mockReturnValue(of(true)) }
        const openMock = jest.spyOn(dialog, 'open').mockReturnValue(dialogRefMock as any)
        const emitSpy = jest.spyOn(component.actionClick, 'emit')

        component.onApprove()

        expect(openMock).toHaveBeenCalledWith(DialogConfirmComponent, {
            data: {
                title: 'Are you sure?',
                body: `Please click <strong>Yes</strong> to approve this request.`
            }
        })

        dialogRefMock.afterClosed().subscribe(() => {
            expect(emitSpy).toHaveBeenCalledWith({
                action: 'Approve',
                userData: component.selectedUser
            })
        })
    })

    it('should return a formatted date from getDateFromText', () => {
        const dateStr = '25-12-2025'
        const result = component.getDateFromText(dateStr)
        expect(result).toEqual(new Date('2025-12-25'))
    })
})
