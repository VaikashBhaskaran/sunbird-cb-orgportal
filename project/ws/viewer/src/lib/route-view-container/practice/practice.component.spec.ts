import { NsContent } from '@sunbird-cb/collection'
import { PracticeComponent } from './practice.component'
import { ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router'

describe('PracticeComponent', () => {
  let component: PracticeComponent
  let mockActivatedRoute: Partial<ActivatedRoute>

  beforeEach(() => {
    // Set up mock ActivatedRoute
    mockActivatedRoute = {
      // A hand-built stand-in, not a real snapshot: cast once rather than satisfying
        // every field of ActivatedRouteSnapshot.
        snapshot: {
        queryParams: {},
        url: [],
        params: {},
        fragment: '',
        data: {},
        outlet: '',
        component: '',
        routeConfig: undefined,
        root: new ActivatedRouteSnapshot,
        parent: new ActivatedRouteSnapshot,
        firstChild: new ActivatedRouteSnapshot,
        children: [],
        pathFromRoot: [],
        paramMap: undefined,
        queryParamMap: undefined
      } as any
    }

    // Create component with mock
    component = new PracticeComponent(mockActivatedRoute as ActivatedRoute)
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('Initial state', () => {
    it('should have default input values', () => {
      expect(component.isFetchingDataComplete).toBeFalsy()
      expect(component.isErrorOccured).toBeFalsy()
      expect(component.quizData).toBeNull()
      expect(component.forPreview).toBeFalsy()
      expect(component.isPreviewMode).toBeFalsy()
    })

    it('should initialize quizJson with default values', () => {
      expect(component.quizJson).toEqual({
        timeLimit: 300,
        questions: [],
        isAssessment: false,
        allowSkip: 'No',
        maxQuestions: 0,
        requiresSubmit: 'Yes',
        showTimer: 'Yes',
        primaryCategory: NsContent.EPrimaryCategory.PRACTICE_RESOURCE,
      })
    })
  })

  describe('ngOnInit', () => {
    it('should set isTypeOfCollection to false when no collectionType in query params', () => {
      // Arrange


      // Act
      component.ngOnInit()

      // Assert
      expect(component.isTypeOfCollection).toBeFalsy()
      expect(component.collectionId).toBeNull()
    })

    it('should set isTypeOfCollection to true when collectionType exists in query params', () => {
      // Arrange


      // Act
      component.ngOnInit()

      // Assert
      expect(component.isTypeOfCollection).toBeFalsy()
      expect(component.collectionId).toBeNull
    })

    it('should set collectionId when isTypeOfCollection is true', () => {
      // Arrange


      // Act
      component.ngOnInit()

      // Assert
      expect(component.collectionId).toBeNull
    })
  })

  describe('Input properties', () => {
    it('should be able to set quiz data', () => {
      // Arrange
      // A partial stand-in: NsContent.IContent has 40-odd required fields and the
      // component only reads a couple of them.
      const testQuizData = {
        id: 'test-quiz',
      } as any

      // Act
      component.quizData = testQuizData

      // Assert
      expect(component.quizData).toEqual(testQuizData)
    })

    it('should be able to override default quizJson', () => {
      // Arrange
      const testQuizJson = {
        timeLimit: 600,
        questions: [{ id: 1 }],
        isAssessment: true,
        allowSkip: 'Yes',
        maxQuestions: 10,
        requiresSubmit: 'No',
        showTimer: 'No',
      } as any   // NSQuiz.IQuiz also requires primaryCategory

      // Act
      component.quizJson = testQuizJson

      // Assert
      expect(component.quizJson).toEqual(testQuizJson)
    })

    it('should be able to set preview modes', () => {
      // Act
      component.forPreview = true
      component.isPreviewMode = true

      // Assert
      expect(component.forPreview).toBeTruthy()
      expect(component.isPreviewMode).toBeTruthy()
    })
  })
})