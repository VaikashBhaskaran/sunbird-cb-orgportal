import { BasicInfoComponent } from './basic-info.component'
import { of, throwError } from 'rxjs'
import { FormBuilder } from '@angular/forms'
import * as _ from 'lodash'

describe('BasicInfoComponent', () => {
  let component: BasicInfoComponent
  let mockDialogRef: any
  let mockFormBuilder: any
  let mockMatSnackBar: any
  let mockEventSvc: any
  let mockLoaderService: any
  let mockData: any

  beforeEach(() => {
    // Create mock objects
    mockDialogRef = {
      close: jest.fn()
    }

    mockFormBuilder = {
      group: jest.fn().mockReturnValue({
        valid: true,
        controls: {
          eventName: { value: 'Test Event Name' },
          eventType: { value: 'record' }
        }
      })
    }

    mockMatSnackBar = {
      open: jest.fn()
    }

    mockEventSvc = {
      createContent: jest.fn(),
      uploadContent: jest.fn(),
      createEvent: jest.fn()
    }

    mockLoaderService = {
      changeLoaderState: jest.fn()
    }

    mockData = {
      userProfile: {
        rootOrgId: 'root-org-id',
        userId: 'user-id',
        givenName: 'John',
        firstName: 'John',
        departmentName: 'Test Department',
        userName: 'johnDoe',
        email: 'john@example.com'
      },
      userEmail: 'john@example.com'
    }

    // Initialize component
    component = new BasicInfoComponent(
      mockDialogRef,
      mockData,
      mockFormBuilder as FormBuilder,
      mockMatSnackBar,
      mockEventSvc,
      mockLoaderService,
      // ConfigurationsService, added since this spec was written.
      { unMappedUser: { roles: [] } } as any
    )
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should initialize form on ngOnInit', () => {
    const createFormSpy = jest.spyOn(component, 'createForm')
    component.ngOnInit()
    expect(createFormSpy).toHaveBeenCalled()
  })

  it('should create form with required controls', () => {
    component.createForm()
    expect(mockFormBuilder.group).toHaveBeenCalled()
  })

  describe('onFileSelected', () => {
    it('should return early if no files are selected', () => {
      const files: any[] = []
      component.onFileSelected(files)
      expect(component.imgURL).toBeNull()
    })

    it('should show error for unsupported file types', () => {
      const files = [{ type: 'application/pdf' }]
      const openSnackBarSpy = jest.spyOn(component as any, 'openSnackBar')

      component.onFileSelected(files)

      expect(openSnackBarSpy).toHaveBeenCalledWith('Only JPG and PNG files are supported')
      expect(component.imgURL).toBeNull()
    })

    it('should show error if file is too large', () => {
      const files = [{ type: 'image/jpeg', size: 600000 }] // Larger than 500KB
      const openSnackBarSpy = jest.spyOn(component as any, 'openSnackBar')

      component.onFileSelected(files)

      expect(openSnackBarSpy).toHaveBeenCalledWith('Please select an image with a size of less than 500KB.')
      expect(component.imgURL).toBeNull()
    })

    it('should process valid image file', () => {
      // Mock FileReader
      const mockFileReader: any = {
        readAsDataURL: jest.fn(),
        onload: null,
        result: 'data:image/jpeg;base64,abcdef'
      }

      global.FileReader = jest.fn().mockImplementation(() => mockFileReader) as unknown as typeof FileReader

      const files = [{ type: 'image/jpeg', size: 300000 }] // Valid size

      component.onFileSelected(files)

      expect(component.imagePath).toEqual(files[0])

      // Trigger onload
      mockFileReader.onload(new Event('load'))
      expect(component.imgURL).toBe('data:image/jpeg;base64,abcdef')
    })
  })

  describe('onSave', () => {
    it('should call saveImage when form is valid and image is uploaded', () => {
      const saveImageSpy = jest.spyOn(component, 'saveImage').mockImplementation()

      component.eventForm = { valid: true } as any
      component.imgURL = 'data:image/jpeg;base64,abcdef'

      component.onSave()

      expect(saveImageSpy).toHaveBeenCalled()
    })

    it('should show error when form is valid but no image is uploaded', () => {
      const openSnackBarSpy = jest.spyOn(component as any, 'openSnackBar')

      component.eventForm = { valid: true } as any
      component.imgURL = null

      component.onSave()

      expect(openSnackBarSpy).toHaveBeenCalledWith('Please upload image')
    })
  })

  describe('saveImage', () => {
    it('should process image and create content when image is provided', () => {
      // Setup
      component.imagePath = { type: 'image/jpeg', size: 300000 }
      component.userProfile = mockData.userProfile

      const contentResponse = { result: { identifier: 'content-id' } }
      const uploadResponse = { result: { artifactUrl: 'https://storage.googleapis.com/igot/path/to/image.jpg' } }

      mockEventSvc.createContent.mockReturnValue(of(contentResponse))
      mockEventSvc.uploadContent.mockReturnValue(of(uploadResponse))

      const createEventSpy = jest.spyOn(component, 'createEvent').mockImplementation()

      // Execute
      component.saveImage()

      // Verify
      expect(mockLoaderService.changeLoaderState).toHaveBeenCalledWith(true)
      expect(mockEventSvc.createContent).toHaveBeenCalled()
      expect(mockEventSvc.uploadContent).toHaveBeenCalledWith('content-id', expect.any(FormData))
      expect(mockLoaderService.changeLoaderState).toHaveBeenCalledWith(false)
      expect(createEventSpy).toHaveBeenCalled()
    })

    it('should handle error from createContent API call', () => {
      // Setup
      component.imagePath = { type: 'image/jpeg', size: 300000 }
      component.userProfile = mockData.userProfile

      const errorResponse = { error: { message: 'Something went wrong please try again' } }

      mockEventSvc.createContent.mockReturnValue(throwError(() => errorResponse))

      const openSnackBarSpy = jest.spyOn(component as any, 'openSnackBar')

      // Execute
      component.saveImage()

      // Verify
      expect(mockLoaderService.changeLoaderState).toHaveBeenCalledWith(true)
      expect(mockEventSvc.createContent).toHaveBeenCalled()
      expect(openSnackBarSpy).toHaveBeenCalledWith('Something went wrong please try again')
      expect(mockLoaderService.changeLoaderState).toHaveBeenCalledWith(false)
    })
  })

  describe('createEvent', () => {
    it('should create event successfully', () => {
      // Setup
      component.eventForm = {
        valid: true,
        controls: {
          eventName: { value: 'Test Event' },
          eventType: { value: 'record' }
        }
      } as any
      component.imgURL = 'data:image/jpeg;base64,abcdef'
      component.userProfile = mockData.userProfile
      component.userEmail = mockData.userEmail

      const successResponse = { result: { identifier: 'event-id' } }
      mockEventSvc.createEvent.mockReturnValue(of(successResponse))

      const openSnackBarSpy = jest.spyOn(component as any, 'openSnackBar')

      // Execute
      component.createEvent('https://example.com/image.jpg')

      // Verify
      expect(mockLoaderService.changeLoaderState).toHaveBeenCalledWith(true)
      expect(mockEventSvc.createEvent).toHaveBeenCalled()
      expect(openSnackBarSpy).toHaveBeenCalledWith('Event created successfully')
      expect(mockDialogRef.close).toHaveBeenCalledWith('event-id')
      expect(mockLoaderService.changeLoaderState).toHaveBeenCalledWith(false)
    })

    it('should handle error from createEvent API call', () => {
      // Setup
      component.eventForm = {
        valid: true,
        controls: {
          eventName: { value: 'Test Event' },
          eventType: { value: 'record' }
        }
      } as any
      component.imgURL = 'data:image/jpeg;base64,abcdef'
      component.userProfile = mockData.userProfile

      const errorResponse = { error: { message: 'Something went wrong while creating event, please try again' } }
      mockEventSvc.createEvent.mockReturnValue(throwError(() => errorResponse))

      const openSnackBarSpy = jest.spyOn(component as any, 'openSnackBar')

      // Execute
      component.createEvent('https://example.com/image.jpg')

      // Verify
      expect(mockLoaderService.changeLoaderState).toHaveBeenCalledWith(true)
      expect(mockEventSvc.createEvent).toHaveBeenCalled()
      expect(openSnackBarSpy).toHaveBeenCalledWith('Something went wrong while creating event, please try again')
      expect(mockLoaderService.changeLoaderState).toHaveBeenCalledWith(false)
    })
  })

  it('should open snack bar with message', () => {
    const message = 'Test message';
    (component as any).openSnackBar(message)
    expect(mockMatSnackBar.open).toHaveBeenCalledWith(message)
  })
})