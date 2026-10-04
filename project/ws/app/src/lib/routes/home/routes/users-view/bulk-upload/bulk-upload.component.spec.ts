import { Subject, of, throwError } from 'rxjs'
import { BulkUploadComponent } from './bulk-upload.component'
import { HttpErrorResponse } from '@angular/common/http'

// Mock services and dependencies
const mockFileService = {
    // ngOnInit pipes this straight into takeUntil, so it has to be an observable.
    getBulkUploadDataV1: jest.fn().mockReturnValue(of({ result: { content: [] } })),
    validateFile: jest.fn(),
    upload: jest.fn(),
    download: jest.fn()
}

const mockMatSnackBar = {
    open: jest.fn()
}

const mockRouter = {
    snapshot: {
        parent: {
            data: {
                configService: {
                    unMappedUser: {
                        rootOrg: {
                            rootOrgId: 'test-org-id'
                        }
                    },
                    userProfileV2: {
                        email: 'test@example.com',
                        mobile: '1234567890'
                    }
                }
            }
        }
    },
    data: {
        subscribe: jest.fn(callback => {
            callback({
                pageData: {
                    data: {
                        downloadSampleFilePath: '/test/path',
                        downloadAsFileName: 'sample.csv'
                    }
                }
            })
            return { unsubscribe: jest.fn() }
        })
    }
}

const mockMatDialog = {
    open: jest.fn(() => ({
        componentInstance: {
            resendOTP: new Subject(),
            otpVerified: new Subject()
        },
        close: jest.fn()
    }))
}

const mockUsersService = {
    sendOtp: jest.fn()
}

describe('BulkUploadComponent', () => {
    let component: BulkUploadComponent
    let originalConsoleError: any

    beforeEach(() => {
        // Save original console.error
        originalConsoleError = console.error
        console.error = jest.fn()

        // Reset mocks
        jest.clearAllMocks()

        // Initialize component with mocked dependencies
        component = new BulkUploadComponent(
            mockFileService as any,
            mockMatSnackBar as any,
            mockRouter as any,
            mockMatDialog as any,
            mockUsersService as any,
            // LoaderService, added since this spec was written. getBulkStatusList pushes
            // through changeLoad directly as well as calling changeLoaderState.
            { changeLoaderState: jest.fn(), changeLoad: { next: jest.fn() } } as any
        )
    })

    afterEach(() => {
        // Restore console.error
        console.error = originalConsoleError
    })

    describe('initialisation', () => {
        it('should initialize component properties from route data', () => {
            // rootOrgId and userProfile are read in ngOnInit; only the download paths come
            // from the constructor's route subscription.
            component.ngOnInit()

            expect(component.rootOrgId).toBe('test-org-id')
            expect(component.userProfile).toBeDefined()
            expect(component.downloadSampleFilePath).toBe('/test/path')
            expect(component.downloadAsFileName).toBe('sample.csv')
        })
    })

    describe('ngOnInit', () => {
        it('should call getBulkStatusList', () => {
            const spy = jest.spyOn(component, 'getBulkStatusList')
            component.ngOnInit()
            expect(spy).toHaveBeenCalled()
        })
    })

    describe('ngAfterViewInit', () => {
        it('should set lastIndex to first size option', () => {
            component.sizeOptions = [10, 20]
            component.ngAfterViewInit()
            expect(component.lastIndex).toBe(10)
        })
    })

    describe('onChangePage', () => {
        it('should update startIndex and lastIndex based on page event', () => {
            const pageEvent = { pageIndex: 1, pageSize: 10, length: 100 }
            component.onChangePage(pageEvent)
            expect(component.startIndex).toBe(10)
            expect(component.lastIndex).toBe(20)
        })
    })

    describe('getBulkStatusList', () => {
        it('should update lastUploadList on successful API call', () => {
            const mockResponse = {
                result: {
                    content: [
                        { dateCreatedOn: '2023-01-02T00:00:00Z', fileName: 'file1.csv' },
                        { dateCreatedOn: '2023-01-01T00:00:00Z', fileName: 'file2.csv' }
                    ]
                }
            }

            mockFileService.getBulkUploadDataV1.mockReturnValue(of(mockResponse))

            component.getBulkStatusList()

            expect(mockFileService.getBulkUploadDataV1).toHaveBeenCalledWith(component.rootOrgId)
            expect(component.lastUploadList.length).toBe(2)
            // Check sorting - newest first
            expect(component.lastUploadList[0].fileName).toBe('file1.csv')
            expect(component.lastUploadList[1].fileName).toBe('file2.csv')
        })

        it('should show error message on API call failure', () => {
            const errorResponse = new HttpErrorResponse({ status: 500, statusText: 'Server Error' })
            mockFileService.getBulkUploadDataV1.mockReturnValue(throwError(errorResponse))

            component.getBulkStatusList()

            expect(mockMatSnackBar.open).toHaveBeenCalledWith('Unable to get Bulk status list')
        })
    })

    describe('showFileUploadProgress', () => {
        it('should open file progress dialog', () => {
            component.showFileUploadProgress()

            expect(mockMatDialog.open).toHaveBeenCalled()
            expect(component.fileUploadDialogInstance).toBeDefined()
        })
    })

    describe('handleDownloadFile', () => {
        it('should open the file download URL in a new tab', () => {
            const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation()
            const listObj = { fileName: 'test-file.csv' }

            component.handleDownloadFile(listObj)

            expect(windowOpenSpy).toHaveBeenCalledWith(
                '/apis/proxies/v8/user/v1/bulkuser/download/test-file.csv',
                '_blank'
            )

            windowOpenSpy.mockRestore()
        })
    })

    describe('handleDownloadSampleFile', () => {
        it('should call fileService.download with correct params', () => {
            component.downloadSampleFilePath = '/path/to/sample'
            component.downloadAsFileName = 'sample.csv'

            component.handleDownloadSampleFile()

            expect(mockFileService.download).toHaveBeenCalledWith('/path/to/sample', 'sample.csv')
        })
    })

    describe('handleFileClick', () => {
        it('should reset the value of the target', () => {
            const mockEvent = { target: { value: 'old-value' } }

            component.handleFileClick(mockEvent)

            expect(mockEvent.target.value).toBe('')
        })
    })

    describe('sendOTP', () => {
        it('should call generateAndVerifyOTP with email if user has email', () => {
            component.userProfile = { email: 'test@example.com' }
            const spy = jest.spyOn(component, 'generateAndVerifyOTP')

            component.sendOTP()

            expect(spy).toHaveBeenCalledWith('email')
        })

        it('should call generateAndVerifyOTP with phone if user has no email', () => {
            component.userProfile = { mobile: '1234567890' }
            const spy = jest.spyOn(component, 'generateAndVerifyOTP')

            component.sendOTP()

            expect(spy).toHaveBeenCalledWith('phone')
        })
    })

    describe('generateAndVerifyOTP', () => {
        it('should send OTP to email and show success message', () => {
            component.userProfile = { email: 'test@example.com' }
            mockUsersService.sendOtp.mockReturnValue(of({ result: true }))
            const verifyOtpSpy = jest.spyOn(component, 'verifyOTP').mockImplementation()

            // The OTP is only sent on the resend path; without the flag the method just
            // opens the verification dialog.
            component.generateAndVerifyOTP('email', 'resend')

            expect(mockUsersService.sendOtp).toHaveBeenCalledWith('test@example.com', 'email')
            expect(mockMatSnackBar.open).toHaveBeenCalledWith(
                'An OTP has been sent to your Email address, (Valid for 15 min\'s)'
            )
            expect(verifyOtpSpy).not.toHaveBeenCalled()
        })

        it('should send OTP to phone and show success message', () => {
            component.userProfile = { mobile: '1234567890' }
            mockUsersService.sendOtp.mockReturnValue(of({ result: true }))
            const verifyOtpSpy = jest.spyOn(component, 'verifyOTP').mockImplementation()

            component.generateAndVerifyOTP('phone', 'resend')

            expect(mockUsersService.sendOtp).toHaveBeenCalledWith('1234567890', 'phone')
            expect(mockMatSnackBar.open).toHaveBeenCalledWith(
                'An OTP has been sent to your Mobile number, (Valid for 15 min\'s)'
            )
            expect(verifyOtpSpy).not.toHaveBeenCalled()
        })

        it('should not call verifyOTP if resendFlag is provided', () => {
            component.userProfile = { email: 'test@example.com' }
            mockUsersService.sendOtp.mockReturnValue(of({ result: true }))
            const verifyOtpSpy = jest.spyOn(component, 'verifyOTP').mockImplementation()

            component.generateAndVerifyOTP('email', 'resend')

            expect(verifyOtpSpy).not.toHaveBeenCalled()
        })

        it('should show error message on API call failure', () => {
            component.userProfile = { email: 'test@example.com' }
            const errorResponse = new HttpErrorResponse({
                error: { params: { errmsg: 'Custom error message' } },
                status: 500
            })
            mockUsersService.sendOtp.mockReturnValue(throwError(errorResponse))

            component.generateAndVerifyOTP('email', 'resend')

            expect(mockMatSnackBar.open).toHaveBeenCalledWith('Custom error message')
        })

        it('should show generic error message when specific error message is not available', () => {
            component.userProfile = { email: 'test@example.com' }
            const errorResponse = new HttpErrorResponse({ status: 500 })
            mockUsersService.sendOtp.mockReturnValue(throwError(errorResponse))

            component.generateAndVerifyOTP('email', 'resend')

            expect(mockMatSnackBar.open).toHaveBeenCalledWith(
                'Unable to send OTP to your email, please try again later!'
            )
        })
    })

    describe('handleOnFileChange', () => {
        beforeEach(() => {
            // sendOTP and verifyOTP both read the signed-in user's contact details, which
            // ngOnInit would normally have put here.
            component.userProfile = { email: 'test@example.com', mobile: '1234567890' }
        })

        it('should set fileName and fileSelected when valid file is selected', () => {
            mockFileService.validateFile.mockReturnValue(true)
            const verifyOtpSpy = jest.spyOn(component, 'verifyOTP').mockImplementation()

            const file = new File(['test'], 'test.csv', { type: 'text/csv' })
            const mockEvent = {
                target: {
                    files: [file]
                }
            }

            component.handleOnFileChange(mockEvent)

            expect(component.fileName).toBe('test.csv')
            expect(component.fileSelected).toBe(file)
            expect(component.showFileError).toBe(false)
            expect(verifyOtpSpy).toHaveBeenCalled()
        })

        it('should set showFileError to true when file is invalid', () => {
            mockFileService.validateFile.mockReturnValue(false)

            const file = new File(['test'], 'invalid.txt', { type: 'text/plain' })
            const mockEvent = {
                target: {
                    files: [file]
                }
            }

            component.handleOnFileChange(mockEvent)

            expect(component.showFileError).toBe(true)
        })
    })

    describe('verifyOTP', () => {
        beforeEach(() => {
            // sendOTP and verifyOTP both read the signed-in user's contact details, which
            // ngOnInit would normally have put here.
            component.userProfile = { email: 'test@example.com', mobile: '1234567890' }
        })

        it('should open OTP verification dialog and handle successful verification', () => {
            const mockDialogRef = {
                componentInstance: {
                    resendOTP: new Subject(),
                    otpVerified: new Subject()
                },
                close: jest.fn()
            }

            mockMatDialog.open.mockReturnValue(mockDialogRef)

            const uploadSpy = jest.spyOn(component, 'uploadCSVFile').mockImplementation()
            const showProgressSpy = jest.spyOn(component, 'showFileUploadProgress').mockImplementation()

            component.verifyOTP('email')

            // Simulate OTP verified event
            mockDialogRef.componentInstance.otpVerified.next(true)

            expect(mockMatDialog.open).toHaveBeenCalled()
            expect(showProgressSpy).toHaveBeenCalled()
            expect(uploadSpy).toHaveBeenCalled()
        })

        it('should handle resend OTP request', () => {
            const mockDialogRef = {
                componentInstance: {
                    resendOTP: new Subject(),
                    otpVerified: new Subject()
                },
                close: jest.fn()
            }

            mockMatDialog.open.mockReturnValue(mockDialogRef)

            const generateOtpSpy = jest.spyOn(component, 'generateAndVerifyOTP').mockImplementation()

            component.verifyOTP('email')

            // Simulate resend OTP event
            mockDialogRef.componentInstance.resendOTP.next('email')

            expect(generateOtpSpy).toHaveBeenCalledWith('email', 'resend')
        })
    })

    describe('uploadCSVFile', () => {
        beforeEach(() => {
            component.fileUploadDialogInstance = { close: jest.fn() }
        })

        it('should upload valid file and show success message', () => {
            mockFileService.validateFile.mockReturnValue(true)
            mockFileService.upload.mockReturnValue(of({ result: true }))

            component.fileName = 'test.csv'
            component.fileSelected = new File(['test'], 'test.csv', { type: 'text/csv' })

            const getBulkStatusListSpy = jest.spyOn(component, 'getBulkStatusList').mockImplementation()

            component.uploadCSVFile()

            expect(mockFileService.upload).toHaveBeenCalled()
            expect(component.fileUploadDialogInstance.close).toHaveBeenCalled()
            expect(mockMatSnackBar.open).toHaveBeenCalledWith('File uploaded successfully!')
            expect(component.fileName).toBe('')
            expect(component.fileSelected).toBe('')
            expect(getBulkStatusListSpy).toHaveBeenCalled()
        })

        it('should show error message on API call failure', () => {
            mockFileService.validateFile.mockReturnValue(true)
            const errorResponse = new HttpErrorResponse({ status: 500 })
            mockFileService.upload.mockReturnValue(throwError(errorResponse))

            component.fileName = 'test.csv'
            component.fileSelected = new File(['test'], 'test.csv', { type: 'text/csv' })

            component.uploadCSVFile()

            expect(mockMatSnackBar.open).toHaveBeenCalledWith(
                'Uploading CSV file failed due to some error, please try again later!'
            )
        })

        it('should set showFileError to true when file is invalid', () => {
            mockFileService.validateFile.mockReturnValue(false)

            component.fileName = 'invalid.txt'
            component.fileSelected = new File(['test'], 'invalid.txt', { type: 'text/plain' })

            component.uploadCSVFile()

            expect(component.showFileError).toBe(true)
        })
    })

    describe('handleChangePage', () => {
        it('should update pagination variables', () => {
            const pageEvent = { pageIndex: 2, pageSize: 20, length: 100 }

            component.handleChangePage(pageEvent)

            expect(component.pageSize).toBe(20)
            expect(component.startIndex).toBe(40)
            expect(component.lastIndex).toBe(60)
        })
    })

    describe('ngOnDestroy', () => {
        it('should unsubscribe from destroySubject$', () => {
            const unsubscribeSpy = jest.spyOn(component['destroySubject$'], 'unsubscribe')

            component.ngOnDestroy()

            expect(unsubscribeSpy).toHaveBeenCalled()
        })
    })
})