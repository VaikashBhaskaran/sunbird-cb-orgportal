import { CompetencySummaryComponent } from './competency-summary.component'
import { InitService } from '../../../../../../../../../src/app/services/init.service'
import { environment } from '../../../../../../../../../src/environments/environment'

describe('CompetencySummaryComponent', () => {
    let component: CompetencySummaryComponent
    let initServiceMock: jest.Mocked<InitService>

    beforeEach(() => {
        initServiceMock = {
            configSvc: {
                // The component reads `compentency` - spelled that way in the source.
                compentency: {
                    [environment.compentencyVersionKey]: {
                        vKey: 'vKey',
                        vCompetencyArea: 'area',
                        vCompetencyTheme: 'theme',
                    }
                }
            }
        } as any

        component = new CompetencySummaryComponent(initServiceMock as InitService)
    })

    it('should initialize with default values', () => {
        component.ngOnInit()
        expect(component.selectedCardData).toEqual([])
        expect(component.competencySummaryObj).toEqual([
            { title: 'behavioural', behavioural: { listData: [], count: 0 } },
            { title: 'functional', functional: { listData: [], count: 0 } },
            { title: 'domain', domain: { listData: [], count: 0 } }
        ])
    })

    it('should correctly set compentencyKey on ngOnInit', () => {
        component.ngOnInit()
        expect(component.compentencyKey).toEqual(initServiceMock.configSvc.compentency[environment.compentencyVersionKey])
    })

    it('should update competencySummaryObj on ngOnChanges', () => {
        const mockContentData = [
            { selected: true, vKey: [{ area: 'behavioural', theme: 'theme1' }] },
            { selected: true, vKey: [{ area: 'functional', theme: 'theme2' }] },
        ]
        component.contentData = mockContentData
        component.ngOnChanges()
        expect(component.selectedCardData.length).toBe(2)
        expect(component.selectedCardData[0]).toEqual(mockContentData[0])
        expect(component.selectedCardData[1]).toEqual(mockContentData[1])
        expect(component.competencySummaryObj[0].behavioural.count).toBe(1)
        expect(component.competencySummaryObj[1].functional.count).toBe(1)
    })

    it('should handle the checkIfThemeNameExists correctly', () => {
        const listData = [{ competencyTheme: 'theme1', count: 1 }]
        const fitem = { theme: 'theme1' }

        const result = component.checkIfThemeNameExists(listData, fitem)
        expect(result).toBe(false)
        expect(listData[0].count).toBe(2)
    })

    it('should return true from checkIfThemeNameExists if theme does not exist', () => {
        const listData = [{ competencyTheme: 'theme1', count: 1 }]
        const fitem = { theme: 'theme2' }

        const result = component.checkIfThemeNameExists(listData, fitem)
        expect(result).toBe(true)
    })

    it('should correctly map content data and update counts in ngOnChanges', () => {
        const mockContentData = [
            { selected: true, vKey: [{ area: 'behavioural', competencyTheme: 'theme1' }] },
            { selected: true, vKey: [{ area: 'functional', competencyTheme: 'theme2' }] },
        ]
        component.contentData = mockContentData
        component.ngOnChanges()

        // Assert that the behavioral and functional counts are updated
        expect(component.competencySummaryObj[0].behavioural.count).toBe(1)
        expect(component.competencySummaryObj[1].functional.count).toBe(1)
    })

    it('should handle multiple items with the same competency theme', () => {
        const mockContentData = [
            { selected: true, vKey: [{ area: 'behavioural', competencyTheme: 'theme1' }] },
            { selected: true, vKey: [{ area: 'behavioural', competencyTheme: 'theme1' }] },
        ]
        component.contentData = mockContentData
        component.ngOnChanges()

        // The count tracks distinct themes: checkIfThemeNameExists gates the increment, so
        // two items sharing 'theme1' are counted once.
        expect(component.competencySummaryObj[0].behavioural.count).toBe(1)
        expect(component.competencySummaryObj[0].behavioural.listData).toHaveLength(1)
    })
})
