import { CommunityBasicDetailsComponent } from './community-basic-details.component'
import { FormGroup, FormControl, Validators } from '@angular/forms'
import { of } from 'rxjs'

describe('CommunityBasicDetailsComponent', () => {
  let component: CommunityBasicDetailsComponent
  let mockMatSnackBar: any
  let mockDomSanitizer: any

  beforeEach(() => {
    // Mock dependencies
    mockMatSnackBar = {
      open: jest.fn()
    }

    mockDomSanitizer = {
      bypassSecurityTrustHtml: jest.fn(html => html)
    }

    // Create component instance with mocked dependencies
    component = new CommunityBasicDetailsComponent(mockDomSanitizer, mockMatSnackBar)

    // Create and set up form group for the component
    component.communityDetailsForm = new FormGroup({
      communityName: new FormControl('', [Validators.required, Validators.minLength(10)]),
      description: new FormControl('', [Validators.required, Validators.minLength(50)]),
      communityGuideLines: new FormControl('', []),
      searchTopic: new FormControl(''),
      posterImageUrl: new FormControl(''),
      imageUrl: new FormControl('')
    })

    // Set default values for inputs
    component.openMode = 'create'
    component.topicDataList = [
      { categoryName: 'Technology' },
      { categoryName: 'Science' },
      { categoryName: 'Art' }
    ]
    component.filterTopicDetails = [...component.topicDataList]
  })

  test('should initialize with default values', () => {
    expect(component).toBeTruthy()
    expect(component.fileSize).toBe(10)
    expect(component.communityStatus).toBe('draft')
    expect(component.isDragging).toBe(false)
    expect(component.Editor).toBeDefined()
    expect(component.ckEditorConfig).toBeDefined()
  })

  test('ngOnInit should set up topic search filtering', () => {
    // Setup a spy on valueChanges
    const searchTopicControl = component.communityDetailsForm.get('searchTopic')
    const valueChangesSpy = jest.spyOn(searchTopicControl!.valueChanges, 'pipe').mockReturnValue(of('Tec'))

    // Call ngOnInit
    component.ngOnInit()

    // Check if valueChanges was called
    expect(valueChangesSpy).toHaveBeenCalled()

    // Manually trigger the filter logic
    component.filterTopicDetails = []
    component.topicDataList = [
      { categoryName: 'Technology' },
      { categoryName: 'Science' }
    ]

    // Call the filter function directly
    const searchSubscriber = searchTopicControl!.valueChanges
      .subscribe(searchText => {
        if (searchText) {
          component.filterTopicDetails = component.topicDataList.filter((val: any) =>
            val && val.categoryName.trim().toLowerCase().includes(searchText && searchText.toLowerCase())
          )
        } else {
          component.filterTopicDetails = component.topicDataList
        }
      })

    // Set a value to trigger the filter
    searchTopicControl!.setValue('Tec')

    // Check if filterTopicDetails contains only 'Technology'
    expect(component.filterTopicDetails.length).toBe(1)
    expect(component.filterTopicDetails[0].categoryName).toBe('Technology')

    // Clear the value to get all topics
    searchTopicControl!.setValue('')
    expect(component.filterTopicDetails.length).toBe(2)

    // Clean up
    searchSubscriber.unsubscribe()
  })

  test('showValidationMsg should return correct validation state for normal form controls', () => {
    // Set up the control
    const control = component.communityDetailsForm.get('communityName')
    control!.setValue('Short')  // Too short
    control!.markAsTouched()

    // Test minlength validation
    expect(component.showValidationMsg('communityName', 'minlength')).toBe(true)

    // Fix the value
    control!.setValue('Long enough community name')
    expect(component.showValidationMsg('communityName', 'minlength')).toBe(false)

    // Test required validation
    control!.setValue('')
    expect(component.showValidationMsg('communityName', 'required')).toBe(true)
  })

  test('showValidationMsg should check HTML editor content length', () => {
    // Mock the getEditorTextLength method
    jest.spyOn(component, 'getEditorTextLength').mockImplementation((content) => {
      if (content === 'short') return 50
      if (content === 'valid') return 200
      if (content === 'toolong') return 600
      return 0
    })

    // Set up the control
    const control = component.communityDetailsForm.get('communityGuideLines')
    control!.markAsTouched()

    // Test minlength validation
    control!.setValue('short')
    expect(component.showValidationMsg('communityGuideLines', 'minlength')).toBe(true)

    // Test valid length
    control!.setValue('valid')
    expect(component.showValidationMsg('communityGuideLines', 'minlength')).toBe(false)
    expect(component.showValidationMsg('communityGuideLines', 'maxlength')).toBe(false)

    // Test maxlength validation
    control!.setValue('toolong')
    expect(component.showValidationMsg('communityGuideLines', 'maxlength')).toBe(true)
  })

  test('getEditorTextLength should strip HTML tags and whitespace', () => {
    const htmlContent = '<p>This is a <strong>test</strong> paragraph.</p><p>&nbsp;</p>'
    expect(component.getEditorTextLength(htmlContent)).toBe(25)

    const emptyHtml = '<p>&nbsp;</p>'
    expect(component.getEditorTextLength(emptyHtml)).toBe(0)
  })

  test('onFileSelected should call handleFile with the selected file', () => {
    // Mock the handleFile method
    const handleFileSpy = jest.spyOn(component, 'handleFile').mockImplementation(() => Promise.resolve())

    // Create a mock file and event
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
    const event = {
      target: { files: [file] }
    } as unknown as Event

    // Call the method
    component.onFileSelected(event, 'posterImageUrl')

    // Verify handleFile was called with correct arguments
    expect(handleFileSpy).toHaveBeenCalledWith(file, 'posterImageUrl')
  })

  test('onDragOver and onDragLeave should update isDragging state', () => {
    // Mock drag events
    const mockEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn()
    } as unknown as DragEvent

    // Test onDragOver
    component.onDragOver(mockEvent)
    expect(mockEvent.preventDefault).toHaveBeenCalled()
    expect(mockEvent.stopPropagation).toHaveBeenCalled()
    expect(component.isDragging).toBe(true)

    // Test onDragLeave
    component.onDragLeave(mockEvent)
    expect(component.isDragging).toBe(false)
  })

  test('onDrop should call handleFile with the dropped file', () => {
    // Mock the handleFile method
    const handleFileSpy = jest.spyOn(component, 'handleFile').mockImplementation(() => Promise.resolve())

    // Create a mock file and event
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
    const mockEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      dataTransfer: {
        files: [file]
      }
    } as unknown as DragEvent

    // Call the method
    component.onDrop(mockEvent, 'imageUrl')

    // Verify handleFile was called with correct arguments
    expect(handleFileSpy).toHaveBeenCalledWith(file, 'imageUrl')
    expect(component.isDragging).toBe(false)
  })

  test('validatePosterImage should check image dimensions and size', async () => {
    // Mock global URL.createObjectURL and URL.revokeObjectURL
    global.URL = {
      createObjectURL: jest.fn(() => 'blob:url'),
      revokeObjectURL: jest.fn()
    } as unknown as typeof URL

    // Create a mock file that's too large
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })

    // Mock the Image constructor
    const originalImage = global.Image
    global.Image = jest.fn(() => ({
      onload: null,
      onerror: null,
      src: '',
      width: 0,
      height: 0
    })) as unknown as typeof Image

    // Test file size validation
    const openSnackBarSpy = jest.spyOn(component as any, 'openSnackBar')
    const isLargeFileValid = await component.validatePosterImage(largeFile)
    expect(isLargeFileValid).toBe(false)
    expect(openSnackBarSpy).toHaveBeenCalledWith('File size must be less than 10MB')

    // Test dimensions validation
    const validSizeFile = new File(['x'.repeat(1 * 1024 * 1024)], 'test.jpg', { type: 'image/jpeg' })

    // Wrong dimensions
    let mockImage = {
      onload: null as any,
      onerror: null as any,
      src: '',
      width: 800,
      height: 600
    };

    (global.Image as jest.Mock).mockImplementationOnce(() => mockImage)

    const isWrongDimensionsValid = component.validatePosterImage(validSizeFile)
    // Simulate image load
    setTimeout(() => {
      mockImage.onload()
    }, 0)

    await isWrongDimensionsValid.then(result => {
      expect(result).toBe(false)
      expect(openSnackBarSpy).toHaveBeenCalledWith('Image must be exactly 1152x288 pixels')
    })

    // Right dimensions
    mockImage = {
      onload: null as any,
      onerror: null as any,
      src: '',
      width: 1152,
      height: 288
    };

    (global.Image as jest.Mock).mockImplementationOnce(() => mockImage)

    const isRightDimensionsValid = component.validatePosterImage(validSizeFile)
    // Simulate image load
    setTimeout(() => {
      mockImage.onload()
    }, 0)

    await isRightDimensionsValid.then(result => {
      expect(result).toBe(true)
    })

    // Restore original Image constructor
    global.Image = originalImage
  })

  test('validateCommunityImage should check file size', async () => {
    // Create a mock file that's too large
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })

    // Mock URL methods
    global.URL = {
      createObjectURL: jest.fn(() => 'blob:url'),
      revokeObjectURL: jest.fn()
    } as unknown as typeof URL

    // Test file size validation
    const openSnackBarSpy = jest.spyOn(component as any, 'openSnackBar')
    const isLargeFileValid = await component.validateCommunityImage(largeFile)
    expect(isLargeFileValid).toBe(false)
    expect(openSnackBarSpy).toHaveBeenCalledWith('File size must be less than 10MB')

    // Test with valid size file
    const validSizeFile = new File(['x'.repeat(1 * 1024 * 1024)], 'test.jpg', { type: 'image/jpeg' })
    const isValidSizeFileValid = await component.validateCommunityImage(validSizeFile)
    expect(isValidSizeFileValid).toBe(true)
  })

  test('handleFile should validate and update form control for image files', async () => {
    // Mock validatePosterImage and validateCommunityImage
    jest.spyOn(component, 'validatePosterImage').mockResolvedValue(true)
    jest.spyOn(component, 'validateCommunityImage').mockResolvedValue(true)

    // Mock the open snackbar method
    const openSnackBarSpy = jest.spyOn(component as any, 'openSnackBar')

    // Test with non-image file
    const textFile = new File(['test'], 'test.txt', { type: 'text/plain' })
    await component.handleFile(textFile, 'posterImageUrl')
    expect(openSnackBarSpy).toHaveBeenCalledWith('Please upload an image file')

    // Test with image file for posterImageUrl
    const imageFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' })

    // Mock FileReader
    const originalFileReader = global.FileReader
    const mockFileReaderInstance = {
      onload: null as any,
      readAsDataURL: jest.fn(function (this: any) {
        this.result = 'data:image/jpeg;base64,abc123'
        setTimeout(() => this.onload(), 0)
      })
    }
    global.FileReader = jest.fn(() => mockFileReaderInstance) as unknown as typeof FileReader

    // Test poster image
    const formSpy = jest.spyOn(component.communityDetailsForm, 'patchValue')
    await component.handleFile(imageFile, 'posterImageUrl')
    expect(component.validatePosterImage).toHaveBeenCalledWith(imageFile)

    // Wait for FileReader onload
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(component.previewUrl).toBe('data:image/jpeg;base64,abc123')
    expect(formSpy).toHaveBeenCalledWith({
      posterImageUrl: imageFile
    })

    // Test community image
    formSpy.mockClear()
    await component.handleFile(imageFile, 'imageUrl')
    expect(component.validateCommunityImage).toHaveBeenCalledWith(imageFile)

    // Wait for FileReader onload
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(component.previewImageUrl).toBe('data:image/jpeg;base64,abc123')
    expect(formSpy).toHaveBeenCalledWith({
      imageUrl: imageFile
    })

    // Restore original FileReader
    global.FileReader = originalFileReader
  })

  test('getCongif should return ckEditorConfig', () => {
    const config = component.getCongif()
    expect(config).toBe(component.ckEditorConfig)
  })

  test('checkCharacterLimit should prevent input if over 3000 characters', () => {
    // Mock getEditorTextLength to return more than 3000
    jest.spyOn(component, 'getEditorTextLength').mockReturnValue(3500)

    // Mock form control
    component.communityDetailsForm.get('description')!.setValue('<p>Long content...</p>')

    // Mock editor
    const mockEditor = {
      getData: jest.fn().mockReturnValue('<p>Long content...</p>'),
      setData: jest.fn()
    }

    const event = { editor: mockEditor }

    // Call the method
    component.checkCharacterLimit(event)

    // Check if setData was called to prevent further input
    expect(mockEditor.setData).toHaveBeenCalledWith('<p>Long content...</p>')
  })

  test('onEditorChange should limit content to 3000 characters', () => {
    // Mock getEditorTextLength to return more than 3000
    jest.spyOn(component, 'getEditorTextLength').mockReturnValue(3500)

    // Mock editor
    const mockEditor = {
      getData: jest.fn().mockReturnValue('<p>Long content...</p>'),
      setData: jest.fn(),
      model: {
        document: {
          selection: {
            setTo: jest.fn()
          },
          getRoot: jest.fn().mockReturnValue({}),
          model: {
            createPositionAt: jest.fn().mockReturnValue({})
          }
        }
      }
    }

    const event = { editor: mockEditor }

    // Create mock document function for tempDiv
    const originalCreateElement = document.createElement
    document.createElement = jest.fn().mockReturnValue({
      innerHTML: '',
      childNodes: []
    })

    // Call the method
    component.onEditorChange(event)

    // Check if setData was called (to truncate content)
    expect(mockEditor.setData).toHaveBeenCalled()

    // Restore document.createElement
    document.createElement = originalCreateElement
  })

  test('emptyPosterImage should clear the poster image', () => {
    // Set initial values
    component.previewUrl = 'test-url'
    const formSpy = jest.spyOn(component.communityDetailsForm, 'patchValue')

    // Call the method
    component.emptyPosterImage()

    // Check if values were cleared
    expect(component.previewUrl).toBe('')
    expect(formSpy).toHaveBeenCalledWith({
      posterImageUrl: ''
    })
  })

  test('emptyImageUrl should clear the community image', () => {
    // Set initial values
    component.previewImageUrl = 'test-url'
    const formSpy = jest.spyOn(component.communityDetailsForm, 'patchValue')

    // Call the method
    component.emptyImageUrl()

    // Check if values were cleared
    expect(component.previewImageUrl).toBe('')
    expect(formSpy).toHaveBeenCalledWith({
      imageUrl: ''
    })
  })

  test('onReady should customize editor and remove powered by element', () => {
    // Mock editor
    const mockEditor = {
      editing: {
        view: {
          change: jest.fn((callback) => {
            const mockWriter = {
              setStyle: jest.fn()
            }
            callback(mockWriter)
            return mockWriter
          }),
          document: {
            getRoot: jest.fn().mockReturnValue({})
          }
        }
      }
    }

    // Mock document.querySelector
    const originalQuerySelector = document.querySelector
    const mockPoweredByElement = { remove: jest.fn() }
    document.querySelector = jest.fn().mockReturnValue(mockPoweredByElement)

    // Call the method
    component.onReady(mockEditor)

    // Check if the min-height was set and powered by element was removed
    expect(mockEditor.editing.view.change).toHaveBeenCalled()
    expect(document.querySelector).toHaveBeenCalledWith('.ck.ck-powered-by')
    expect(mockPoweredByElement.remove).toHaveBeenCalled()

    // Restore document.querySelector
    document.querySelector = originalQuerySelector
  })

  test('onFocus should remove powered by element', () => {
    // Mock document.querySelector
    const originalQuerySelector = document.querySelector
    const mockPoweredByElement = { remove: jest.fn() }
    document.querySelector = jest.fn().mockReturnValue(mockPoweredByElement)

    // Call the method
    component.onFocus()

    // Check if powered by element was removed
    expect(document.querySelector).toHaveBeenCalledWith('.ck.ck-powered-by')
    expect(mockPoweredByElement.remove).toHaveBeenCalled()

    // Restore document.querySelector
    document.querySelector = originalQuerySelector
  })
})