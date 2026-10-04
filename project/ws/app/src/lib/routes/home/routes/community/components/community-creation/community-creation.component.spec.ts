import { of, throwError } from 'rxjs'
import { CommunityCreationComponent } from './community-creation.component'
import { FormBuilder } from '@angular/forms'
import { HttpErrorResponse } from '@angular/common/http'
import { environment } from 'src/environments/environment'

// Mock services
const mockActivatedRoute = {
  params: of({}),
  snapshot: {
    data: {
      configService: {
        unMappedUser: {
          id: 'test-user-id',
          rootOrg: {
            orgName: 'Test Org'
          },
          rootOrgId: 'test-org-id'
        }
      },
      communityDetails: {
        data: {}
      }
    },
    url: [{ path: 'test-path' }]
  }
}

const mockRouter = {
  navigate: jest.fn()
}

const mockDialog = {
  open: jest.fn().mockReturnValue({
    afterClosed: () => of(true)
  })
}

const mockMatSnackBar = {
  open: jest.fn()
}

const mockCommunityService = {
  getTopicDetails: jest.fn().mockReturnValue(of({
    result: {
      search_results: {
        data: [
          { categoryId: 'topic1', categoryName: 'Topic 1' },
          { categoryId: 'topic2', categoryName: 'Topic 2' }
        ]
      }
    }
  })),
  createCommunity: jest.fn().mockReturnValue(of({
    result: {
      communityId: 'test-community-id'
    }
  })),
  updateCommunity: jest.fn().mockReturnValue(of({})),
  publishCommunity: jest.fn().mockReturnValue(of({
    result: true
  })),
  fileUpload: jest.fn().mockReturnValue(of({
    result: {
      url: 'igot/discussionhub/test-image-url'
    }
  }))
}

const mockLoaderService = {
  changeLoaderState: jest.fn()
}

const mockChangeDetectorRef = {
  detectChanges: jest.fn()
}

describe('CommunityCreationComponent', () => {
  let component: CommunityCreationComponent
  let formBuilder: FormBuilder

  beforeEach(() => {
    formBuilder = new FormBuilder()

    // Reset mocks before each test
    jest.clearAllMocks()

    // Create component instance with mocked dependencies
    component = new CommunityCreationComponent(
      formBuilder,
      mockChangeDetectorRef as any,
      mockRouter as any,
      mockDialog as any,
      mockMatSnackBar as any,
      mockCommunityService as any,
      mockLoaderService as any,
      mockActivatedRoute as any
    )

    // Setup the component's forms
    component.communityDetailsForm = formBuilder.group({
      communityName: '',
      topicName: null,
      posterImageUrl: '',
      description: '',
      communityGuideLines: '',
      moderators: [],
      imageUrl: '',
      competencies_v6: [],
      searchTopic: ''
    });

    // Mock environment data
    (component as any).environmentData = {
      karmYogiPath: 'test-path',
      dicussV2Bucket: 'test-bucket'
    }

    // Set up necessary properties
    component.competencies = []
    component.communityId = 'test-community-id'
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should initialize form and fetch topic data on creation', () => {
    jest.spyOn(component as any, 'getTopicData')
    jest.spyOn(component as any, 'initializeFormAndParams')
    jest.spyOn(component as any, 'getRouteSubscription');

    // Call constructor logic manually
    (component as any).getTopicData();
    (component as any).initializeFormAndParams();
    (component as any).getRouteSubscription()

    expect((component as any).getTopicData).toHaveBeenCalled()
    expect((component as any).initializeFormAndParams).toHaveBeenCalled()
    expect((component as any).getRouteSubscription).toHaveBeenCalled()
    expect(mockCommunityService.getTopicDetails).toHaveBeenCalled()
  })

  it('should navigate back when openConforamtionPopup is called in view mode', () => {
    component.openMode = 'create'
    component.openConforamtionPopup()
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/community'])
  })

  it('should open confirmation dialog when openConforamtionPopup is called in edit mode', () => {
    component.openMode = 'edit'
    component.openConforamtionPopup()
    expect(mockDialog.open).toHaveBeenCalled()
  })

  it('should check canMoveToNext when on Basic Details step with valid form', () => {
    component.selectedStepperLable = 'Basic Details'
    component.communityDetailsForm.patchValue({
      communityName: 'Test Community Name Long Enough',
      topicName: { categoryId: 'topic1', categoryName: 'Topic 1' },
      posterImageUrl: 'test-image-url',
      description: 'This is a test description that is at least fifty characters long to meet the validation requirements.',
      communityGuideLines: 'These are test community guidelines. They need to be at least one hundred characters long to meet the validation requirements for the form to be considered valid.',
      imageUrl: 'test-image-url'
    })

    const result = component.canMoveToNext
    expect(result).toBeTruthy()
  })

  it('should check canMoveToNext when on Add Competency step without competencies', () => {
    component.selectedStepperLable = 'Add Competency'
    component.competencies = []

    const result = component.canMoveToNext
    expect(result).toBeFalsy()
    expect(mockMatSnackBar.open).toHaveBeenCalled()
  })

  it('should check canMoveToNext when on Add Competency step with competencies', () => {
    component.selectedStepperLable = 'Add Competency'
    component.competencies = [
      { competencyAreaName: 'Area 1', competencyThemeName: 'Theme 1', competencySubThemeName: 'SubTheme 1' }
    ]

    const result = component.canMoveToNext
    expect(result).toBeTruthy()
  })

  it('should check canPublish with invalid form', () => {
    component.selectedStepperLable = 'Preview'
    component.communityDetailsForm.setErrors({ invalid: true })

    const result = component.canPublish
    expect(result).toBeFalsy()
    expect(mockMatSnackBar.open).toHaveBeenCalled()
  })

  it('should check canPublish with valid form but no competencies', () => {
    component.selectedStepperLable = 'Preview'
    component.communityDetailsForm.setErrors(null)
    component.competencies = []

    const result = component.canPublish
    expect(result).toBeFalsy()
    expect(mockMatSnackBar.open).toHaveBeenCalled()
  })

  it('should check canPublish with valid form and competencies', () => {
    component.selectedStepperLable = 'Preview'
    component.communityDetailsForm.setErrors(null)
    component.competencies = [
      { competencyAreaName: 'Area 1', competencyThemeName: 'Theme 1', competencySubThemeName: 'SubTheme 1' }
    ]

    const result = component.canPublish
    expect(result).toBeTruthy()
  })

  it('should create community when saveAndExit is called in create mode', () => {
    component.openMode = 'create'
    component.communityDetailsForm.patchValue({
      communityName: 'Test Community Name',
      topicName: { categoryId: 'topic1', categoryName: 'Topic 1' }
    })

    component.saveAndExit()
    expect(mockCommunityService.createCommunity).toHaveBeenCalled()
  })

  it('should update community when saveAndExit is called in edit mode', () => {
    component.openMode = 'edit'
    component.userProfile = {
      id: 'test-user-id',
      rootOrg: {
        orgName: 'Test Org'
      },
      rootOrgId: 'test-org-id'
    }
    component.communityDetailsObject = {
      communityId: 'test-community-id'
    }

    component.saveAndExit()
    expect(mockCommunityService.updateCommunity).toHaveBeenCalled()
  })

  it('should handle error when creating community with duplicate name', () => {
    component.openMode = 'create'
    component.communityDetailsForm.patchValue({
      communityName: 'Test Community Name',
      topicName: { categoryId: 'topic1', categoryName: 'Topic 1' }
    })

    const errorResponse = new HttpErrorResponse({
      error: {
        responseCode: 'CONFLICT',
        params: {
          errMsg: 'Community name already exists'
        }
      },
      status: 400
    })

    mockCommunityService.createCommunity.mockReturnValueOnce(throwError(() => errorResponse))

    component.saveAndExit()
    expect(mockCommunityService.createCommunity).toHaveBeenCalled()
    expect(mockMatSnackBar.open).toHaveBeenCalledWith(
      'Community name already exists',
      '',
      expect.objectContaining({ panelClass: ['red-snackbar'] })
    )
  })

  it('should handle precondition failed error when creating community', () => {
    component.openMode = 'create'
    component.communityDetailsForm.patchValue({
      communityName: 'Test Community Name',
      topicName: { categoryId: 'topic1', categoryName: 'Topic 1' }
    })

    const errorResponse = new HttpErrorResponse({
      error: {
        params: {
          errMsg: 'Community with the given communityName already present in another organisation'
        }
      },
      status: 412
    })

    mockCommunityService.createCommunity.mockReturnValueOnce(throwError(() => errorResponse))

    component.saveAndExit()
    expect(mockCommunityService.createCommunity).toHaveBeenCalled()
    expect(mockDialog.open).toHaveBeenCalled()
  })

  it('should get changed fields between current and original form values', () => {
    component.originalFormValues = {
      communityName: 'Old Name',
      topicName: { categoryId: 'old-topic', categoryName: 'Old Topic' },
      moderators: []
    }

    component.communityDetailsForm.patchValue({
      communityName: 'New Name',
      topicName: { categoryId: 'new-topic', categoryName: 'New Topic' },
      moderators: ['user1']
    })

    component.communityId = 'test-community-id'

    const changedFields = (component as any).getChangedFields()

    expect(changedFields).toHaveProperty('communityName', 'New Name')
    expect(changedFields).toHaveProperty('topicName')
    expect(changedFields).toHaveProperty('moderators')
    expect(changedFields).toHaveProperty('communityId', 'test-community-id')
  })

  it('should upload community image', () => {
    const communityId = 'test-community-id'
    const mockFile = new File([''], 'filename', { type: 'image/png' })

    component.communityDetailsForm.patchValue({
      posterImageUrl: mockFile,
      imageUrl: 'existing-image-url'
    })

    component.uploadCommunityImage(communityId)

    expect(mockCommunityService.fileUpload).toHaveBeenCalled()
  })

  it('should publish community when all validations pass', () => {
    component.communityId = 'test-community-id'
    component.selectedStepperLable = 'Add Competency'
    component.communityDetailsForm.setErrors(null)
    component.competencies = [
      { competencyAreaName: 'Area 1', competencyThemeName: 'Theme 1', competencySubThemeName: 'SubTheme 1' }
    ]

    jest.spyOn(component, 'canPublish', 'get').mockReturnValue(true)
    jest.spyOn(component as any, 'publishCommunityMethod')

    component.publishCommunity()

    expect((component as any).publishCommunityMethod).toHaveBeenCalled()
  })

  it('should create and then publish community when no communityId exists', () => {
    component.communityId = ''
    component.selectedStepperLable = 'Add Competency'
    component.communityDetailsForm.setErrors(null)
    component.competencies = [
      { competencyAreaName: 'Area 1', competencyThemeName: 'Theme 1', competencySubThemeName: 'SubTheme 1' }
    ]

    jest.spyOn(component, 'canPublish', 'get').mockReturnValue(true)
    jest.spyOn(component as any, 'createCommunityAndPublish')

    component.publishCommunity()

    expect((component as any).createCommunityAndPublish).toHaveBeenCalled()
  })

  it('should handle publishing community with server error', () => {
    component.communityId = 'test-community-id'

    const errorResponse = new HttpErrorResponse({
      error: {
        message: 'Server error'
      },
      status: 500
    })

    mockCommunityService.publishCommunity.mockReturnValueOnce(throwError(() => errorResponse))

    component.publishCommunityMethod()

    expect(mockCommunityService.publishCommunity).toHaveBeenCalled()
    // The component prefers the server's error.message and only falls back to the generic
    // text when it is absent - the fixture supplies 'Server error'.
    expect(mockMatSnackBar.open).toHaveBeenCalledWith(
      'Server error',
      '',
      expect.any(Object)
    )
  })

  it('should get environment base URL', () => {
    // getEnvironmentBaseUrl reassigns this.environmentData = environment on entry, so the
    // values have to be on the environment module itself, not on the instance.
    const env = environment as any
    const originalPath = env.karmYogiPath
    const originalBucket = env.dicussV2Bucket
    env.karmYogiPath = 'test-path'
    env.dicussV2Bucket = 'test-bucket'

    try {
      const result = component.getEnvironmentBaseUrl()
      expect(result).toBe('test-path/test-bucket')
    } finally {
      env.karmYogiPath = originalPath
      env.dicussV2Bucket = originalBucket
    }
  })

  it('should correctly split URL', () => {
    const result1 = (component as any).splitUrl('igot/discussionhub/test-image')
    expect(result1).toBe('/test-image')

    const result2 = (component as any).splitUrl('igotqa/discussionhub/test-image')
    expect(result2).toBe('/test-image')

    const result3 = (component as any).splitUrl('other/path/test-image')
    expect(result3).toBe('other/path/test-image')
  })

  it('should add competencies and update form control', () => {
    const testCompetencies = [
      { competencyAreaName: 'Area 1', competencyThemeName: 'Theme 1', competencySubThemeName: 'SubTheme 1' }
    ]

    component.addCompetencies(testCompetencies)

    expect(component.competencies).toEqual(testCompetencies)
    expect(component.communityDetailsForm.controls['competencies_v6'].value).toEqual(testCompetencies)
  })

  it('should open confirmation dialog when getConfirmationForCreation is called', () => {
    const errData = {
      params: {
        errMsg: 'Test error message'
      }
    };

    (component as any).getConfirmationForCreation(errData, 'Draft', 'saveAndExit')

    expect(mockDialog.open).toHaveBeenCalled()
  })
})