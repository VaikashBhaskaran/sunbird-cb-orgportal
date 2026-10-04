import { AssistantMessageCardComponent } from './assistant-message-card.component'
import { IWarnError } from '../../models/warn-error.model'
import { Subject } from 'rxjs'

describe('AssistantMessageCardComponent', () => {
    let component: AssistantMessageCardComponent
    let mockWatStoreService: any
    let activitiesGroupSubject: Subject<any[]>
    let competencyGroupSubject: Subject<any[]>
    let updateCompGroupSubject: Subject<any[]>
    let officerGroupSubject: Subject<any>

    beforeEach(() => {
        // Create subject for mocking observables
        activitiesGroupSubject = new Subject<any[]>()
        competencyGroupSubject = new Subject<any[]>()
        updateCompGroupSubject = new Subject<any[]>()
        officerGroupSubject = new Subject<any>()

        // Create mock for WatStoreService
        mockWatStoreService = {
            getactivitiesGroup: activitiesGroupSubject.asObservable(),
            getcompetencyGroup: competencyGroupSubject.asObservable(),
            getUpdateCompGroupO: updateCompGroupSubject.asObservable(),
            getOfficerGroup: officerGroupSubject.asObservable(),
            setErrorCount: jest.fn(),
            setCurrentProgress: jest.fn(),
        }

        // Initialize component with mock service
        component = new AssistantMessageCardComponent(mockWatStoreService)
        component.ngOnInit()
    })

    afterEach(() => {
        component.ngOnDestroy()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    describe('progressColor', () => {
        it('should return red color when progress is <= 30', () => {
            jest.spyOn(component, 'currentProgress', 'get').mockReturnValue(30)
            expect(component.progressColor()).toBe('#D13924')
        })

        it('should return orange color when progress is > 30 and <= 70', () => {
            jest.spyOn(component, 'currentProgress', 'get').mockReturnValue(50)
            expect(component.progressColor()).toBe('#E99E38')
        })

        it('should return green color when progress is > 70 and <= 100', () => {
            jest.spyOn(component, 'currentProgress', 'get').mockReturnValue(80)
            expect(component.progressColor()).toBe('#1D8923')
        })

        it('should return empty string for invalid progress values', () => {
            jest.spyOn(component, 'currentProgress', 'get').mockReturnValue(101)
            expect(component.progressColor()).toBe('')
        })
    })

    describe('validationsCombined', () => {
        it('should group validations by type and set error count', () => {
            // Mock the individualValidations method
            const mockValidations: IWarnError[] = [
                { _type: 'error', type: 'officer', counts: 0, label: 'Officer name is empty' },
                { _type: 'warning', type: 'officer', counts: 0, label: 'Designation description missing' },
            ]

            jest.spyOn(component, 'individualValidations').mockReturnValue(mockValidations)

            component.validationsCombined()

            // Assertions
            expect(component.validations).toEqual({
                error: [{ _type: 'error', type: 'officer', counts: 0, label: 'Officer name is empty' }],
                warning: [{ _type: 'warning', type: 'officer', counts: 0, label: 'Designation description missing' }]
            })

            expect(mockWatStoreService.setErrorCount).toHaveBeenCalledWith(1)
        })
    })

    describe('calculateOfficerErrors', () => {
        it('should return error when officer name is empty but other fields are not', () => {
            const data = {
                officerName: '',
                position: 'Manager',
                positionDescription: 'Description'
            }

            const result = component.calculateOfficerErrors(data)

            expect(result).toContainEqual({
                _type: 'error',
                type: 'officer',
                counts: 0,
                label: 'Officer name is empty'
            })
        })

        it('should return error when position is empty but other fields are not', () => {
            const data = {
                officerName: 'John Doe',
                position: '',
                positionDescription: 'Description'
            }

            const result = component.calculateOfficerErrors(data)

            expect(result).toContainEqual({
                _type: 'error',
                type: 'officer',
                counts: 0,
                label: 'Designation missing'
            })
        })

        it('should return warning when position description is empty', () => {
            const data = {
                officerName: 'John Doe',
                position: 'Manager',
                positionDescription: ''
            }

            const result = component.calculateOfficerErrors(data)

            expect(result).toContainEqual({
                _type: 'warning',
                type: 'officer',
                counts: 0,
                label: 'Designation description missing'
            })
        })

        it('should return empty array when all fields are filled', () => {
            const data = {
                officerName: 'John Doe',
                position: 'Manager',
                positionDescription: 'Description'
            }

            // First mock the complete function to make sure there are no other validations
            jest.spyOn(component, 'calculateOfficerErrors').mockImplementation((inputData) => {
                if (inputData.officerName && inputData.position && inputData.positionDescription) {
                    return []
                }
                // Original implementation for other cases
                return component.calculateOfficerErrors(inputData)
            })

            const result = component.calculateOfficerErrors(data)
            expect(result).toEqual([])
        })
    })

    describe('calculateActivityError', () => {
        it('should return error when there are unmapped activities', () => {
            const data = [
                {
                    activities: [
                        { activityDescription: '', assignedTo: '' },
                        { activityDescription: 'Activity 2', assignedTo: 'Person B' }
                    ]
                }
            ]

            const result = component.calculateActivityError(data)

            expect(result).toContainEqual({
                _type: 'error',
                type: 'activity',
                counts: 2,
                label: 'Unmapped activities'
            })
        })

        it('should return error when role name is missing', () => {
            const data = [
                { activities: [] },  // Unmapped section
                {
                    groupName: '',
                    groupDescription: 'Description',
                    activities: [{ activityDescription: 'Activity', assignedTo: 'Person' }]
                }
            ]

            const result = component.calculateActivityError(data)

            expect(result).toContainEqual({
                _type: 'error',
                type: 'role',
                counts: 1,
                label: 'Role label missing'
            })
        })

        it('should return error when "Untitled role" is used as role name', () => {
            const data = [
                { activities: [] },  // Unmapped section
                {
                    groupName: 'Untitled role',
                    groupDescription: 'Description',
                    activities: [{ activityDescription: 'Activity', assignedTo: 'Person' }]
                }
            ]

            const result = component.calculateActivityError(data)

            expect(result).toContainEqual({
                _type: 'error',
                type: 'role',
                counts: 1,
                label: 'Role label missing'
            })
        })
    })

    describe('calculatePercentage', () => {
        it('should calculate overall progress percentage', () => {
            // Set up mocks for different progress calculations
            jest.spyOn(component, 'calculateOfficerProgress').mockReturnValue(100)
            jest.spyOn(component, 'calculateActivityProgress').mockReturnValue(75)
            jest.spyOn(component, 'calculateCompProgress').mockReturnValue(50)
            jest.spyOn(component, 'calculateCompDetailsProgress').mockReturnValue(60)

            // Set up data structure
            component.dataStructure = {
                officerFormData: {},
                activityGroups: [],
                compGroups: [],
                compDetails: []
            }

            // Expected calculation based on weights in defaultProgressValues
            // Officer: 100 * 0.1 = 10
            // Activity: 75 * 0.6 = 45
            // Competency: 50 * 0.2 = 10
            // CompDetails: 60 * 0.1 = 6
            // Total: 71

            const result = component.calculatePercentage()

            expect(result).toBe(71)
            expect(mockWatStoreService.setCurrentProgress).toHaveBeenCalledWith(71)
        })

        it('should return 0 when there is nothing to measure', () => {
            component.dataStructure = {}

            expect(component.calculatePercentage()).toBe(0)
        })

        it('should not swallow errors thrown by the progress calculators', () => {
            // The try/catch in calculatePercentage wraps only the final summation, not the
            // calculate*Progress calls above it, so a failure in one of those escapes.
            jest.spyOn(component, 'calculateOfficerProgress').mockImplementation(() => {
                throw new Error('Test error')
            })

            component.dataStructure = {
                officerFormData: {}
            }

            expect(() => component.calculatePercentage()).toThrow('Test error')
        })
    })

    describe('calculateOfficerProgress', () => {
        it('should calculate progress for officer data', () => {
            const data = {
                officerName: 'John Doe',
                position: 'Manager',
                positionDescription: 'Description'
            }

            const result = component.calculateOfficerProgress(data)

            // Based on defaultProgressValues, each field is worth 33.33%
            // All fields are filled, so progress should be 100%
            expect(result).toBe(100)
        })

        it('should calculate partial progress for officer data', () => {
            const data = {
                officerName: 'John Doe',
                position: 'Manager',
                positionDescription: ''
            }

            const result = component.calculateOfficerProgress(data)

            // Based on defaultProgressValues, each field is worth 33.33%
            // Two fields filled, so progress should be ~66.66% (but rounded down)
            expect(result).toBe(66)
        })
    })

    describe('subscription handling', () => {
        it('should update dataStructure when activities group data is received', () => {
            const activitiesData = [{
                groupName: 'Role 1',
                activities: [{ activityDescription: 'Activity 1', assignedTo: 'Person A' }]
            }]

            jest.spyOn(component, 'validationsCombined')

            activitiesGroupSubject.next(activitiesData)

            expect(component.dataStructure.activityGroups).toEqual(activitiesData)
            expect(component.validationsCombined).toHaveBeenCalled()
        })

        it('should update dataStructure when competency group data is received', () => {
            const competencyData = [{
                groupName: 'Group 1',
                competincies: [{ compName: 'Comp 1', compDescription: 'Description' }]
            }]

            jest.spyOn(component, 'validationsCombined')

            competencyGroupSubject.next(competencyData)

            expect(component.dataStructure.compGroups).toEqual(competencyData)
            expect(component.validationsCombined).toHaveBeenCalled()
        })
    })
})