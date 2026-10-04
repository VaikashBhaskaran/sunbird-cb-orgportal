import { MaterialDetailsComponent } from './material-details.component'
// import { FormBuilder } from '@angular/forms'
// import { MatSnackBar } from '@angular/material/snack-bar'
// import { EventsService } from '../../services/events.service'
// import { LoaderService } from '../../../../../../../../../../../src/app/services/loader.service'
import { of, throwError } from 'rxjs'
import { HttpErrorResponse } from '@angular/common/http'
import * as _ from 'lodash'

// Mock the environment
jest.mock('../../../../../../../../../../../src/environments/environment', () => ({
  environment: {
    domainName: 'https://test-domain.com'
  }
}))

describe('MaterialDetailsComponent', () => {
  let component: MaterialDetailsComponent
  let formBuilderMock: any
  let matSnackBarMock: any
  let eventSvcMock: any
  let loaderServiceMock: any

  beforeEach(() => {
    // Initialize mocks
    formBuilderMock = {
      group: jest.fn().mockReturnValue({
        setValue: jest.fn(),
        controls: {
          title: {
            valueChanges: of(''),
            patchValue: jest.fn(),
            updateValueAndValidity: jest.fn()
          },
          content: {
            patchValue: jest.fn(),
            updateValueAndValidity: jest.fn()
          }
        },
        markAllAsTouched: jest.fn(),
        disable: jest.fn(),
        valid: true,
        value: { title: 'Test Title', content: 'Test Content' }
      })
    }

    matSnackBarMock = {
      open: jest.fn()
    }

    eventSvcMock = {
      createContent: jest.fn(),
      uploadContent: jest.fn(),
      // Used to branch the material form; false keeps the default (non-BharatKalp) path.
      isBharatKalpCategory: jest.fn().mockReturnValue(false)
    }

    loaderServiceMock = {
      changeLoaderState: jest.fn()
    }

    // Create component instance
    component = new MaterialDetailsComponent(
      formBuilderMock as any,
      matSnackBarMock as any,
      eventSvcMock as any,
      loaderServiceMock as any
    )

    // Set initial component properties
    component.materialDetails = {
      title: 'Test Material',
      content: 'content_file_test.pdf'
    }

    component.userProfile = {
      rootOrgId: 'test-org-id',
      departmentName: 'Test Department',
      userName: 'Test User',
      userId: 'test-user-id'
    }
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnChanges', () => {
    it('should call buildForm when materialDetails changes', () => {
      // Spy on buildForm method
      const buildFormSpy = jest.spyOn(component, 'buildForm')

      // Mock SimpleChanges
      const changes = {
        materialDetails: {
          currentValue: { title: 'New Title', content: 'new_content.pdf' },
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      }

      component.ngOnChanges(changes)

      expect(buildFormSpy).toHaveBeenCalled()
    })

    it('should not call buildForm when other properties change', () => {
      // Spy on buildForm method
      const buildFormSpy = jest.spyOn(component, 'buildForm')

      // Mock SimpleChanges with a different property
      const changes = {
        openMaterial: {
          currentValue: true,
          previousValue: false,
          firstChange: true,
          isFirstChange: () => true
        }
      }

      component.ngOnChanges(changes)

      expect(buildFormSpy).not.toHaveBeenCalled()
    })
  })

  describe('buildForm', () => {
    it('should initialize the form with materialDetails values', () => {
      // Call buildForm
      component.buildForm()

      // Check if formBuilder.group was called
      expect(formBuilderMock.group).toHaveBeenCalled()

      // A second buildForm() takes the setValue branch because eventForm already exists,
      // so the valueChanges subscription is only ever made on the first build. Assert that
      // the existing form is refreshed rather than rebuilt.
      component.buildForm()
      expect(formBuilderMock.group).toHaveBeenCalledTimes(1)
      expect(component.eventForm.setValue).toHaveBeenCalledWith(component.materialDetails)
    })

    it('should disable the form when in view mode', () => {
      // Set view mode
      component.openMode = 'view'

      // Call buildForm
      component.buildForm()

      // Check if form was disabled
      expect(component.eventForm.disable).toHaveBeenCalled()
    })

    // it('should update currentMaterialSaved when title changes', () => {
    //   // Create a mock for valueChanges that will immediately trigger the subscription
    //   // const mockValueChanges = {
    //   //   subscribe: (callback: any) => {
    //   //     callback('New Title')
    //   //     return { unsubscribe: jest.fn() }
    //   //   }
    //   // }

    //   // Setup component with initial state
    //   component.materialDetails = { title: 'Original Title', content: 'test.pdf' }
    //   component.currentMaterialSaved = true

    //   // Mock the form
    //   component.eventForm = formBuilderMock.group()
    //   // component.eventForm.controls.title.valueChanges = mockValueChanges

    //   // Create a spy for the emitter
    //   const emitSpy = jest.spyOn(component.currentMaterialSaveUpdate, 'emit')

    //   // Call buildForm
    //   component.buildForm()

    //   // Check if the value was updated and emitted
    //   expect(component.currentMaterialSaved).toBeTruthy()
    //   expect(emitSpy).toHaveBeenCalledWith(false)
    // })
  })

  describe('genrateMaterialName', () => {
    it('should extract filename from content URL', () => {
      // Setup
      component.eventForm = {
        value: { content: 'path/to/file_test-document.pdf' }
      } as any

      // Call method
      component.genrateMaterialName()

      // Verify
      expect(component.materialName).toBe('test-document.pdf')
    })

    it('should call genrateUploadedDocTypeImg after setting materialName', () => {
      // Spy on the method
      const genrateUploadedDocTypeImgSpy = jest.spyOn(component, 'genrateUploadedDocTypeImg')

      // Setup
      component.eventForm = {
        value: { content: 'path/to/file_document.pdf' }
      } as any

      // Call method
      component.genrateMaterialName()

      // Verify
      expect(genrateUploadedDocTypeImgSpy).toHaveBeenCalled()
    })
  })

  describe('genrateUploadedDocTypeImg', () => {
    it('should set PDF icon for PDF files', () => {
      // Setup
      component.materialName = 'document.pdf'

      // Call method
      component.genrateUploadedDocTypeImg()

      // Verify
      expect(component.uploadedDocTypeImg).toBe('/assets/icons/pdf.svg')
      expect(component.materialType).toBe('1 pdf')
    })

    it('should set PPT icon for PPT files', () => {
      // Setup
      component.materialName = 'presentation.ppt'

      // Call method
      component.genrateUploadedDocTypeImg()

      // Verify
      expect(component.uploadedDocTypeImg).toBe('/assets/icons/ppt.svg')
      expect(component.materialType).toBe('1 ppt')
    })

    it('should set DOC icon for DOC files', () => {
      // Setup
      component.materialName = 'document.doc'

      // Call method
      component.genrateUploadedDocTypeImg()

      // Verify
      expect(component.uploadedDocTypeImg).toBe('/assets/icons/doc.svg')
      expect(component.materialType).toBe('1 doc')
    })
  })

  describe('removeMaterial', () => {
    it('should clear content and materialName', () => {
      // Setup
      component.eventForm = {
        controls: {
          content: {
            patchValue: jest.fn(),
            updateValueAndValidity: jest.fn()
          }
        }
      } as any
      component.materialName = 'test.pdf'

      // Call method
      component.removeMaterial()

      // Verify
      expect(component.eventForm.controls.content.patchValue).toHaveBeenCalledWith('')
      expect(component.eventForm.controls.content.updateValueAndValidity).toHaveBeenCalled()
      expect(component.materialName).toBe('')
    })
  })

  describe('openStatus', () => {
    it('should emit canCloseOrOpenMaterial event', () => {
      // Spy on the emitter
      const emitSpy = jest.spyOn(component.canCloseOrOpenMaterial, 'emit')

      // Call method
      component.openStatus(true)

      // Verify
      expect(emitSpy).toHaveBeenCalledWith(true)
    })
  })

  describe('deleteMaterialFromList', () => {
    it('should emit deleteMaterial event', () => {
      // Spy on the emitter
      const emitSpy = jest.spyOn(component.deleteMaterial, 'emit')

      // Call method
      component.deleteMaterialFromList()

      // Verify
      expect(emitSpy).toHaveBeenCalledWith(true)
    })
  })

  describe('saveDetails', () => {
    it('should emit updatedMaterialDetails when form is valid', () => {
      // Spy on the emitter
      const emitSpy = jest.spyOn(component.updatedMaterialDetails, 'emit')

      // Setup
      component.eventForm = {
        valid: true,
        value: { title: 'Test Title', content: 'Test Content' },
        markAllAsTouched: jest.fn()
      } as any

      // Call method
      component.saveDetails()

      // Verify
      expect(emitSpy).toHaveBeenCalledWith(component.eventForm.value)
      expect(component.eventForm.markAllAsTouched).toHaveBeenCalled()
    })

    it('should not emit updatedMaterialDetails when form is invalid', () => {
      // Spy on the emitter
      const emitSpy = jest.spyOn(component.updatedMaterialDetails, 'emit')

      // Setup
      component.eventForm = {
        valid: false,
        value: { title: '', content: '' },
        markAllAsTouched: jest.fn()
      } as any

      // Call method
      component.saveDetails()

      // Verify
      expect(emitSpy).not.toHaveBeenCalled()
      expect(component.eventForm.markAllAsTouched).toHaveBeenCalled()
    })
  })

  describe('preventDefaultCDK', () => {
    it('should prevent default behavior and stop propagation', () => {
      // Mock event
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        target: document.createElement('div')
      } as any

      // Call method
      component.preventDefaultCDK(mockEvent)

      // Verify
      expect(mockEvent.preventDefault).toHaveBeenCalled()
      expect(mockEvent.stopPropagation).toHaveBeenCalled()
    })

    it('should change opacity on enter/leave', () => {
      // Mock event with target element
      const mockElement = document.createElement('div')
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        target: mockElement
      } as any

      // Call method with 'enter'
      component.preventDefaultCDK(mockEvent, 'enter')

      // Verify
      expect(mockElement.style.opacity).toBe('0.5')

      // Call method with 'leave'
      component.preventDefaultCDK(mockEvent, 'leave')

      // Verify
      expect(mockElement.style.opacity).toBe('1')
    })
  })

  describe('onDrop', () => {
    it('should call onMaterialSelect with files from dataTransfer', () => {
      // Spy on the method
      const onMaterialSelectSpy = jest.spyOn(component, 'onMaterialSelect')

      // Mock files
      // onMaterialSelect checks files[0].type and then hands files[0] to
      // FileReader.readAsDataURL, which needs a real Blob.
      const mockFiles = [new File(['test'], 'test.pdf', { type: 'application/pdf' })]

      // Mock event - onDrop receives a single DragEvent, not an array, and reads
      // event.dataTransfer.files straight through to onMaterialSelect.
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: {
          files: mockFiles
        },
        target: document.createElement('div'),
        type: 'msword'
      } as any

      // Call method
      component.onDrop(mockEvent)

      // Verify
      expect(onMaterialSelectSpy).toHaveBeenCalledWith(mockFiles)
    })
  })

  describe('onMaterialSelect', () => {
    it('should return early if no files are provided', () => {
      // Call method with empty array
      component.onMaterialSelect([])

      // Verify loader was not activated
      expect(loaderServiceMock.changeLoaderState).not.toHaveBeenCalled()
    })

    it('should show error for invalid file type', () => {
      // Mock files with invalid type
      const mockFiles = [{ type: 'image/jpeg' }]

      // Call method
      component.onMaterialSelect(mockFiles)

      // Verify error message
      expect(matSnackBarMock.open).toHaveBeenCalledWith('Invalid file type. Please upload a PDF, PPT, .pptx, .docx, or DOC file.')
    })

    it('should process valid PDF file', () => {
      // Mock FileReader
      const originalFileReader = global.FileReader
      const mockFileReaderInstance = {
        readAsDataURL: jest.fn(),
        onload: null
      }
      global.FileReader = jest.fn(() => mockFileReaderInstance) as any

      // Mock valid file
      const mockFile = {
        type: 'application/pdf',
        name: 'test.pdf'
      }

      // Spy on saveFile method
      // const saveFileSpy = jest.spyOn(component, 'saveFile')

      // Call method
      component.onMaterialSelect([mockFile])

      // Assign value to onload
      mockFileReaderInstance.onload = ({ target: { result: 'data:application/pdf;base64,abc123' } } as any)

      // Verify
      expect(mockFileReaderInstance.readAsDataURL).toHaveBeenCalledWith(mockFile)
      expect(loaderServiceMock.changeLoaderState).toHaveBeenCalledWith(true)
      expect(loaderServiceMock.changeLoaderState).toHaveBeenCalledWith(true)
      // expect(saveFileSpy).toHaveBeenCalledWith(mockFile)

      // Restore original FileReader
      global.FileReader = originalFileReader
    })
  })

  describe('saveFile', () => {
    it('should do nothing if filePath is falsy', () => {
      // Call method with null
      component.saveFile(null)

      // Verify no service calls
      expect(eventSvcMock.createContent).not.toHaveBeenCalled()
    })

    it('should handle successful file upload', () => {
      // Mock response data
      const createContentResponse = {
        result: { identifier: 'content-id-123' }
      }

      const uploadContentResponse = {
        result: { artifactUrl: 'https://storage.googleapis.com/igot/folder/file.pdf' }
      }

      // Setup service mocks
      eventSvcMock.createContent.mockReturnValue(of(createContentResponse))
      eventSvcMock.uploadContent.mockReturnValue(of(uploadContentResponse))

      // Mock file
      const mockFile = {
        type: 'application/pdf',
        name: 'test.pdf'
      }

      // Setup form
      component.eventForm = {
        controls: {
          content: {
            patchValue: jest.fn(),
            updateValueAndValidity: jest.fn()
          }
        }
      } as any

      // Spy on genrateMaterialName
      const genrateMaterialNameSpy = jest.spyOn(component, 'genrateMaterialName')

      // Call method
      component.saveFile(mockFile)

      // Verify
      expect(loaderServiceMock.changeLoaderState).toHaveBeenCalledWith(true)
      expect(eventSvcMock.createContent).toHaveBeenCalled()
      expect(eventSvcMock.uploadContent).toHaveBeenCalledWith('content-id-123', expect.any(FormData))
      expect(loaderServiceMock.changeLoaderState).toHaveBeenCalledWith(false)
      expect(component.eventForm.controls.content.patchValue).toHaveBeenCalledWith('https://test-domain.com/assets/public/folder/file.pdf')
      expect(component.eventForm.controls.content.updateValueAndValidity).toHaveBeenCalled()
      expect(genrateMaterialNameSpy).toHaveBeenCalled()
    })

    it('should handle error during file upload', () => {
      // Mock error response
      const errorResponse = new HttpErrorResponse({
        error: { message: 'Something went wrong please try again' },
        status: 400
      })

      // Setup service mocks
      eventSvcMock.createContent.mockReturnValue(throwError(() => errorResponse))

      // Mock file
      const mockFile = {
        type: 'application/pdf',
        name: 'test.pdf'
      }

      // Call method
      component.saveFile(mockFile)

      // Verify
      expect(loaderServiceMock.changeLoaderState).toHaveBeenCalledWith(true)
      expect(eventSvcMock.createContent).toHaveBeenCalled()
      expect(loaderServiceMock.changeLoaderState).toHaveBeenCalledWith(false)
      expect(matSnackBarMock.open).toHaveBeenCalledWith('Something went wrong please try again')
    })
  })
})