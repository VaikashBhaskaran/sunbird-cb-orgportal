import { Subject, of, throwError } from 'rxjs'
import { BulkUploadComponent } from './bulk-upload.component'
import { HttpErrorResponse } from '@angular/common/http'

describe('BulkUploadComponent', () => {
  let component: BulkUploadComponent
  let fileServiceMock: any
  let matSnackBarMock: any
  let dialogMock: any
  let usersServiceMock: any
  let activateRouteMock: any
  let designationsServiceMock: any
  let dialogRefMock: any
  let dialogComponentInstanceMock: any

  beforeEach(() => {
    // Mock services
    fileServiceMock = {
      // Both are piped through takeUntil and subscribed; res.result.content is sorted.
      getBulkDesignationUploadData: jest.fn().mockReturnValue(of({ result: { content: [] } })),
      getBulkDesignationStatus: jest.fn().mockReturnValue(of({ result: { content: [] } })),
      downloadWithDispositionName: jest.fn(),
      downloadBulkUploadSampleFile: jest.fn(),
      validateExcelFile: jest.fn(),
      bulkUploadDesignation: jest.fn()
    }

    matSnackBarMock = {
      open: jest.fn()
    }

    dialogComponentInstanceMock = {
      otpVerified: new Subject(),
      resendOTP: new Subject(),
      close: jest.fn()
    }

    dialogRefMock = {
      componentInstance: dialogComponentInstanceMock,
      close: jest.fn()
    }

    dialogMock = {
      open: jest.fn().mockReturnValue(dialogRefMock)
    }

    usersServiceMock = {
      // generateAndVerifyOTP pipes and subscribes to this; individual tests override it.
      sendOtp: jest.fn().mockReturnValue(of({ result: 'success' }))
    }

    activateRouteMock = {
      data: new Subject(),
      snapshot: {
        data: {
          configService: {
            userProfile: {
              rootOrgId: 'test-root-org-id'
            },
            userProfileV2: {
              email: 'test@example.com',
              mobile: '1234567890'
            },
            orgReadData: {
              frameworkid: 'test-framework-id'
            }
          }
        }
      }
    }

    designationsServiceMock = {
      frameWorkInfo: null
    }

    // Create component with mocked dependencies
    component = new BulkUploadComponent(
      fileServiceMock,
      matSnackBarMock,
      dialogMock,
      usersServiceMock,
      activateRouteMock as any,
      designationsServiceMock
    )
  })

  it('should initialize properly', () => {
    const getBulkStatusListSpy = jest.spyOn(component, 'getBulkStatusList')

    component.ngOnInit()

    expect(getBulkStatusListSpy).toHaveBeenCalled()
    expect(component.rootOrgId).toBe('test-root-org-id')
    expect(component.bulkUploadFrameworkId).toBe('test-framework-id')
  })

  it('should update bulkUploadFrameworkId if designationsService frameWorkInfo is available', () => {
    designationsServiceMock.frameWorkInfo = {
      code: 'updated-framework-id'
    }

    component.ngOnInit()

    expect(component.bulkUploadFrameworkId).toBe('updated-framework-id')
  })

  it('should set page data from route', () => {
    component.ngOnInit()

    activateRouteMock.data.next({
      pageData: {
        data: {
          bulkUploadConfig: {
            pageSize: 10,
            pageSizeOptions: [10, 20, 30]
          }
        }
      }
    })

    expect(component.pageSize).toBe(10)
    expect(component.sizeOptions).toEqual([10, 20, 30])
  })

  it('should set correct last index after view init', () => {
    component.sizeOptions = [10, 20, 30]

    component.ngAfterViewInit()

    expect(component.lastIndex).toBe(10)
  })

  it('should update index values on page change', () => {
    const pageEvent = {
      pageIndex: 2,
      pageSize: 10,
      length: 100
    }

    component.onChangePage(pageEvent)

    expect(component.startIndex).toBe(20)
    expect(component.lastIndex).toBe(30)
  })

  it('should get bulk status list successfully', () => {
    const mockResponse = {
      result: {
        content: [
          { dateCreatedOn: '2023-01-02', fileName: 'file2.xlsx' },
          { dateCreatedOn: '2023-01-01', fileName: 'file1.xlsx' }
        ]
      }
    }

    fileServiceMock.getBulkDesignationUploadData.mockReturnValue(of(mockResponse))

    component.getBulkStatusList()

    expect(fileServiceMock.getBulkDesignationUploadData).toHaveBeenCalledWith('test-root-org-id')
    expect(component.lastUploadList).toEqual([
      { dateCreatedOn: '2023-01-02', fileName: 'file2.xlsx' },
      { dateCreatedOn: '2023-01-01', fileName: 'file1.xlsx' }
    ])
  })

  it('should handle error when getting bulk status list', () => {
    const errorResponse = new HttpErrorResponse({
      error: 'test error',
      status: 500,
      statusText: 'Internal Server Error'
    })

    fileServiceMock.getBulkDesignationUploadData.mockReturnValue(throwError(errorResponse))

    component.getBulkStatusList()

    expect(matSnackBarMock.open).toHaveBeenCalledWith('Unable to get Bulk status list')
  })

  it('should open file upload progress dialog', () => {
    component.showFileUploadProgress()

    expect(dialogMock.open).toHaveBeenCalledWith(expect.any(Function), {
      data: {},
      disableClose: true,
      panelClass: 'progress-modal'
    })
    expect(component.fileUploadDialogInstance).toBeDefined()
  })

  it('should handle download file', () => {
    const listObj = { fileName: 'test-file.xlsx' } as any
    const mockFilePath = 'path/to/file'

    fileServiceMock.getBulkDesignationStatus.mockReturnValue(mockFilePath)

    component.handleDownloadFile(listObj)

    expect(fileServiceMock.getBulkDesignationStatus).toHaveBeenCalledWith('test-file.xlsx')
    expect(fileServiceMock.downloadWithDispositionName).toHaveBeenCalledWith(mockFilePath)
  })

  it('should handle download sample file', () => {
    const mockFilePath = 'path/to/sample-file'

    fileServiceMock.downloadBulkUploadSampleFile.mockReturnValue(mockFilePath)

    component.handleDownloadSampleFile()

    expect(fileServiceMock.downloadBulkUploadSampleFile).toHaveBeenCalledWith('test-framework-id')
    expect(fileServiceMock.downloadWithDispositionName).toHaveBeenCalledWith(mockFilePath)
  })

  it('should reset value when handling file click', () => {
    const mockEvent = {
      target: {
        value: 'old-value'
      }
    }

    component.handleFileClick(mockEvent)

    expect(mockEvent.target.value).toBe('')
  })

  it('should send OTP through email if available', () => {
    const generateAndVerifyOTPSpy = jest.spyOn(component, 'generateAndVerifyOTP')

    component.sendOTP()

    expect(generateAndVerifyOTPSpy).toHaveBeenCalledWith('email')
  })

  it('should generate and verify OTP successfully', () => {
    const verifyOTPSpy = jest.spyOn(component, 'verifyOTP')

    usersServiceMock.sendOtp.mockReturnValue(of({ result: 'success' }))

    component.generateAndVerifyOTP('email')

    expect(usersServiceMock.sendOtp).toHaveBeenCalledWith('test@example.com', 'email')
    expect(matSnackBarMock.open).toHaveBeenCalledWith(
      expect.stringContaining('An OTP has been sent to your Email address')
    )
    expect(verifyOTPSpy).toHaveBeenCalledWith('email')
  })

  it('should handle error when generating OTP', () => {
    const errorResponse = new HttpErrorResponse({
      error: {
        params: {
          errmsg: 'Custom error message'
        }
      },
      status: 500,
      statusText: 'Internal Server Error'
    })

    usersServiceMock.sendOtp.mockReturnValue(throwError(errorResponse))

    component.generateAndVerifyOTP('email')

    expect(matSnackBarMock.open).toHaveBeenCalledWith('Custom error message')
  })

  it('should handle file change with valid Excel file', () => {
    const mockFile = new File(['content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const fileList = [mockFile]
    const verifyOTPSpy = jest.spyOn(component, 'verifyOTP')

    fileServiceMock.validateExcelFile.mockReturnValue(true)

    component.handleOnFileChange(fileList)

    expect(component.fileName).toBe('test.xlsx')
    expect(component.fileType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    expect(component.fileSelected).toBe(mockFile)
    expect(component.showFileError).toBe(false)
    expect(verifyOTPSpy).toHaveBeenCalledWith('email')
  })

  it('should handle file change with invalid file type', () => {
    const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' })
    const fileList = [mockFile]

    fileServiceMock.validateExcelFile.mockReturnValue(false)

    component.handleOnFileChange(fileList)

    expect(component.showFileError).toBe(true)
  })

  it('should verify OTP and upload file on successful verification', () => {
    const showFileUploadProgressSpy = jest.spyOn(component, 'showFileUploadProgress')
    const uploadCSVFileSpy = jest.spyOn(component, 'uploadCSVFile')

    component.verifyOTP('email')

    expect(dialogMock.open).toHaveBeenCalledWith(expect.any(Function), {
      data: { type: 'email', email: 'test@example.com', mobile: '1234567890' },
      disableClose: false,
      panelClass: 'common-modal'
    })

    // Simulate OTP verification success
    dialogRefMock.componentInstance.otpVerified.next(true)

    expect(showFileUploadProgressSpy).toHaveBeenCalled()
    expect(uploadCSVFileSpy).toHaveBeenCalled()
  })

  it('should upload CSV file successfully', () => {
    component.fileName = 'test.xlsx'
    component.fileSelected = new File(['content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    component.fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    component.fileUploadDialogInstance = dialogRefMock
    const getBulkStatusListSpy = jest.spyOn(component, 'getBulkStatusList')
    const startTimerSpy = jest.spyOn(component, 'startTimer')

    fileServiceMock.validateExcelFile.mockReturnValue(true)
    fileServiceMock.bulkUploadDesignation.mockReturnValue(of({ result: 'success' }))

    component.uploadCSVFile()

    expect(fileServiceMock.bulkUploadDesignation).toHaveBeenCalledWith(
      'test.xlsx',
      expect.any(FormData),
      'test-framework-id',
      'test-root-org-id'
    )
    expect(dialogRefMock.close).toHaveBeenCalled()
    expect(matSnackBarMock.open).toHaveBeenCalledWith('File uploaded successfully!')
    expect(component.fileName).toBe('')
    expect(component.fileSelected).toBe('')
    expect(getBulkStatusListSpy).toHaveBeenCalled()
    expect(startTimerSpy).toHaveBeenCalled()
  })

  it('should handle error when uploading CSV file', () => {
    component.fileName = 'test.xlsx'
    component.fileSelected = new File(['content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    component.fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    component.fileUploadDialogInstance = dialogRefMock

    const errorResponse = new HttpErrorResponse({
      error: 'test error',
      status: 500,
      statusText: 'Internal Server Error'
    })

    fileServiceMock.validateExcelFile.mockReturnValue(true)
    fileServiceMock.bulkUploadDesignation.mockReturnValue(throwError(errorResponse))

    component.uploadCSVFile()

    expect(dialogRefMock.close).toHaveBeenCalled()
    expect(matSnackBarMock.open).toHaveBeenCalledWith(
      'Uploading CSV file failed due to some error, please try again later!'
    )
  })

  it('should not upload file if validation fails', () => {
    component.fileType = 'text/plain'
    fileServiceMock.validateExcelFile.mockReturnValue(false)

    component.uploadCSVFile()

    expect(component.showFileError).toBe(true)
    expect(fileServiceMock.bulkUploadDesignation).not.toHaveBeenCalled()
  })

  it('should handle page change event', () => {
    const pageEvent = {
      pageIndex: 1,
      pageSize: 20,
      length: 100
    }

    component.handleChangePage(pageEvent)

    expect(component.pageSize).toBe(20)
    expect(component.startIndex).toBe(20)
    expect(component.lastIndex).toBe(40)
  })

  it('should clean up subscriptions and timer on destroy', () => {
    const destroySubjectNextSpy = jest.spyOn(component['destroySubject$'], 'unsubscribe')
    jest.spyOn(global, 'clearInterval')

    // Set up interval
    component.interval = setInterval(() => { }, 1000)

    component.ngOnDestroy()

    expect(destroySubjectNextSpy).toHaveBeenCalled()
    expect(clearInterval).toHaveBeenCalledWith(component.interval)
  })

  it('should start timer and clear it after completion', () => {
    jest.useFakeTimers()
    const getBulkStatusListSpy = jest.spyOn(component, 'getBulkStatusList')

    component.timeLeft = 2 // Set shorter time for testing
    component.startTimer()

    // Timer should be running
    expect(component.interval).toBeDefined()

    // timeLeft counts 2 -> 1 -> 0 and only fires on the tick after it reaches 0, so three
    // intervals are needed, not two.
    jest.advanceTimersByTime(3000)

    // Timer should complete and getBulkStatusList should be called
    expect(getBulkStatusListSpy).toHaveBeenCalled()

    jest.useRealTimers()
  })
})