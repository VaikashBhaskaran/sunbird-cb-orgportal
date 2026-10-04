import { BtnContentFeedbackDialogV2Component } from './btn-content-feedback-dialog-v2.component'
import { FeedbackService } from '../../services/feedback.service'
import { MatDialogRef } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { of, throwError } from 'rxjs'
import { FeedbackSnackbarComponent } from '../feedback-snackbar/feedback-snackbar.component'
import { EFeedbackType, EFeedbackRole } from '../../models/feedback.model'

describe('BtnContentFeedbackDialogV2Component', () => {
    let component: BtnContentFeedbackDialogV2Component
    let mockDialogRef: MatDialogRef<BtnContentFeedbackDialogV2Component>
    let mockFeedbackService: jest.Mocked<FeedbackService>
    let mockSnackbar: jest.Mocked<MatSnackBar>

    beforeEach(() => {
        mockDialogRef = { close: jest.fn() } as any
        mockFeedbackService = {
            getFeedbackConfig: jest.fn(),
            submitContentFeedback: jest.fn(),
        } as any
        mockSnackbar = { openFromComponent: jest.fn() } as any

        component = new BtnContentFeedbackDialogV2Component(
            { identifier: 'contentId' } as any, // Mocked content object
            mockDialogRef,
            mockFeedbackService,
            mockSnackbar
        )
    })

    it('should initialize with default values', () => {
        expect(component.positiveFeedbackSendStatus).toBe('none')
        expect(component.negativeFeedbackSendStatus).toBe('none')
        expect(component.singleFeedbackSendStatus).toBe('none')
        expect(component.configFetchStatus).toBe('none')
        expect(component.feedbackForm).toBeTruthy()
        expect(component.singleFeedbackForm).toBeTruthy()
    })

    it('should fetch feedback config on ngOnInit', () => {
        // Only the fields the assertions below care about; IFeedbackConfig asks for more.
        const mockConfig = {
            feedbackEnabled: true,
            feedbackCategories: [],
            feedbackSentimentMode: '',
        } as any
        mockFeedbackService.getFeedbackConfig.mockReturnValue(of(mockConfig))

        component.ngOnInit()

        expect(mockFeedbackService.getFeedbackConfig).toHaveBeenCalled()
        expect(component.configFetchStatus).toBe('done')
        expect(component.feedbackConfig).toBe(mockConfig)
    })

    it('should handle error while fetching feedback config', () => {
        mockFeedbackService.getFeedbackConfig.mockReturnValue(throwError('error'))

        component.ngOnInit()

        expect(mockFeedbackService.getFeedbackConfig).toHaveBeenCalled()
        expect(component.configFetchStatus).toBe('error')
    })

    it('should submit positive feedback successfully', () => {
        mockFeedbackService.submitContentFeedback.mockReturnValue(of({}))
        component.feedbackForm.controls['positive'].setValue('Great content!')

        component.submitPositiveFeedback('Great content!')

        expect(mockFeedbackService.submitContentFeedback).toHaveBeenCalledWith({
            text: 'Great content!',
            contentId: 'contentId',
            sentiment: 'positive',
            type: EFeedbackType.Content,
            role: EFeedbackRole.User,
        })
        expect(component.positiveFeedbackSendStatus).toBe('done')
        expect(mockSnackbar.openFromComponent).toHaveBeenCalledWith(FeedbackSnackbarComponent, {
            data: { action: 'content_feedback_submit', code: 'success' },
        })
        expect(mockDialogRef.close).toHaveBeenCalled()
    })

    it('should handle error while submitting positive feedback', () => {
        mockFeedbackService.submitContentFeedback.mockReturnValue(throwError('error'))
        component.feedbackForm.controls['positive'].setValue('Great content!')

        component.submitPositiveFeedback('Great content!')

        expect(component.positiveFeedbackSendStatus).toBe('error')
        expect(mockSnackbar.openFromComponent).toHaveBeenCalledWith(FeedbackSnackbarComponent, {
            data: { action: 'content_feedback_submit', code: 'failure' },
        })
    })

    it('should submit negative feedback successfully', () => {
        mockFeedbackService.submitContentFeedback.mockReturnValue(of({}))
        component.feedbackForm.controls['negative'].setValue('Needs improvement')

        component.submitNegativeFeedback('Needs improvement')

        expect(mockFeedbackService.submitContentFeedback).toHaveBeenCalledWith({
            text: 'Needs improvement',
            contentId: 'contentId',
            sentiment: 'negative',
            type: EFeedbackType.Content,
            role: EFeedbackRole.User,
        })
        expect(component.negativeFeedbackSendStatus).toBe('done')
        expect(mockSnackbar.openFromComponent).toHaveBeenCalledWith(FeedbackSnackbarComponent, {
            data: { action: 'content_feedback_submit', code: 'success' },
        })
        expect(mockDialogRef.close).toHaveBeenCalled()
    })

    it('should handle error while submitting negative feedback', () => {
        mockFeedbackService.submitContentFeedback.mockReturnValue(throwError('error'))
        component.feedbackForm.controls['negative'].setValue('Needs improvement')

        component.submitNegativeFeedback('Needs improvement')

        expect(component.negativeFeedbackSendStatus).toBe('error')
        expect(mockSnackbar.openFromComponent).toHaveBeenCalledWith(FeedbackSnackbarComponent, {
            data: { action: 'content_feedback_submit', code: 'failure' },
        })
    })

    it('should submit single feedback successfully', () => {
        mockFeedbackService.submitContentFeedback.mockReturnValue(of({}))
        component.singleFeedbackForm.controls['feedback'].setValue('Great work!')

        component.submitSingleFeedback()

        expect(mockFeedbackService.submitContentFeedback).toHaveBeenCalledWith({
            text: 'Great work!',
            contentId: 'contentId',
            role: EFeedbackRole.User,
            type: EFeedbackType.Content,
        })
        expect(component.singleFeedbackSendStatus).toBe('done')
        expect(mockSnackbar.openFromComponent).toHaveBeenCalledWith(FeedbackSnackbarComponent, {
            data: { action: 'content_feedback_submit', code: 'success' },
        })
        expect(mockDialogRef.close).toHaveBeenCalled()
    })

    it('should handle error while submitting single feedback', () => {
        mockFeedbackService.submitContentFeedback.mockReturnValue(throwError('error'))
        component.singleFeedbackForm.controls['feedback'].setValue('Great work!')

        component.submitSingleFeedback()

        expect(component.singleFeedbackSendStatus).toBe('error')
        expect(mockSnackbar.openFromComponent).toHaveBeenCalledWith(FeedbackSnackbarComponent, {
            data: { action: 'content_feedback_submit', code: 'failure' },
        })
    })
})
