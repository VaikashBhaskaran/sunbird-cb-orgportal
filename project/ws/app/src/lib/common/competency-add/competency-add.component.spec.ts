import { of } from 'rxjs'
import { CompetencyAddComponent } from './competency-add.component'

describe('CompetencyAddComponent', () => {
  let component: CompetencyAddComponent
  let mockDialogRef: any
  let mockProfileV2Service: any
  let mockCompetencies: any[]

  beforeEach(() => {
    // Mock the dialog ref
    mockDialogRef = {
      close: jest.fn()
    }

    // Mock the service
    mockProfileV2Service = {
      getFilterEntityV2: jest.fn()
    }

    // Mock competencies
    mockCompetencies = [
      {
        themes: [
          {
            competencyThemeIdentifier: 'theme1',
            subThems: [
              { competencySubThemeIdentifier: 'subtheme1' }
            ]
          }
        ]
      }
    ]

    // Create component instance
    component = new CompetencyAddComponent(
      mockDialogRef,
      mockCompetencies,
      mockProfileV2Service
    )
    // searchControl is created in ngOnInit; setFilteredThemes reads its value, and these
    // tests call the methods directly. Tests that need a specific value override it.
    component.searchControl = { value: '' } as any
  })

  it('should initialize component', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnInit', () => {
    it('should initialize search control and get framework details', () => {
      // Mock the getFilterEntityV2 method
      mockProfileV2Service.getFilterEntityV2.mockReturnValue(of([]))

      // Spy on getFrameWorkDetails
      const getFrameWorkDetailsSpy = jest.spyOn(component, 'getFrameWorkDetails')

      component.ngOnInit()

      expect(component.searchControl).toBeDefined()
      expect(getFrameWorkDetailsSpy).toHaveBeenCalled()
    })
  })

  describe('getFrameWorkDetails', () => {
    it('should call getFilterEntityV2 service and process response', () => {
      const mockResponse = [
        { code: 'competencyarea', terms: [{ name: 'area1', identifier: 'area1' }] },
        { code: 'theme', terms: [] }
      ]

      mockProfileV2Service.getFilterEntityV2.mockReturnValue(of(mockResponse))

      // Spy on generateThemsAndSubThemes
      const generateThemesSpy = jest.spyOn(component, 'generateThemsAndSubThemes')

      component.getFrameWorkDetails()

      expect(mockProfileV2Service.getFilterEntityV2).toHaveBeenCalled()
      expect(generateThemesSpy).toHaveBeenCalledWith(mockResponse)
    })
  })

  describe('generateThemsAndSubThemes', () => {
    it('should process response and set competency areas and themes', () => {
      const mockResponse = [
        {
          code: 'competencyarea',
          terms: [{
            name: 'area1',
            identifier: 'area1',
            associations: [{ identifier: 'theme1' }]
          }]
        },
        {
          code: 'theme',
          terms: [{
            name: 'theme1',
            identifier: 'theme1',
            associations: [{ identifier: 'subtheme1', name: 'subtheme1' }]
          }]
        }
      ]

      // Spy on setFilteredThemes
      const setFilteredThemesSpy = jest.spyOn(component, 'setFilteredThemes')

      component.generateThemsAndSubThemes(mockResponse)

      expect(component.comptencyAreasList.length).toBe(1)
      expect(component.comptencyAreasList[0].identifier).toBe('area1')
      expect(setFilteredThemesSpy).toHaveBeenCalled()
    })

    it('should handle pre-selected themes and subthemes', () => {
      // Setup mock data
      const mockTheme = {
        name: 'theme1',
        identifier: 'theme1',
        associations: [
          { identifier: 'subtheme1', name: 'subtheme1' },
          { identifier: 'subtheme1', name: 'subtheme1' } // Duplicate to test filtering
        ]
      }

      const mockResponse = [
        {
          code: 'competencyarea',
          terms: [{
            name: 'area1',
            identifier: 'area1',
            associations: [{ identifier: 'theme1' }]
          }]
        },
        {
          code: 'theme',
          terms: [mockTheme]
        }
      ]

      // component.competencies = mockCompetencies
      component.generateThemsAndSubThemes(mockResponse)

      expect(component.selectedThemesList.length).toBe(1)
      expect(component.selectedThemesList[0].identifier).toBe('theme1')
      expect(component.selectedThemesList[0].selected).toBe(true)
      expect(component.selectedThemesList[0].preSelected).toBe(true)
    })
  })

  describe('filterDuplicates', () => {
    it('should filter out duplicate items based on key', () => {
      const items = [
        { id: 1, name: 'item1' },
        { id: 2, name: 'item2' },
        { id: 1, name: 'item1 duplicate' }
      ]

      const result = component.filterDuplicates(items, 'id')

      expect(result.length).toBe(2)
      expect(result[0].id).toBe(1)
      expect(result[1].id).toBe(2)
    })
  })

  describe('setFilteredThemes', () => {
    it('should filter themes based on search control value', () => {
      component.validThemesList = [
        { name: 'Angular', identifier: 'angular' },
        { name: 'React', identifier: 'react' },
        { name: 'Vue', identifier: 'vue' }
      ]

      component.searchControl = { value: 'ang' } as any
      component.setFilteredThemes()

      expect(component.filteredThemes.length).toBe(1)
      expect(component.filteredThemes[0].name).toBe('Angular')
    })

    it('should limit themes when themesShowMore is false', () => {
      component.validThemesList = [
        { name: 'Theme1', identifier: 'theme1' },
        { name: 'Theme2', identifier: 'theme2' },
        { name: 'Theme3', identifier: 'theme3' },
        { name: 'Theme4', identifier: 'theme4' },
        { name: 'Theme5', identifier: 'theme5' },
        { name: 'Theme6', identifier: 'theme6' }
      ]

      component.searchControl = { value: '' } as any
      component.themesShowMore = false
      component.limitToShow = 4
      component.preSelectedThemesCount = 0

      component.setFilteredThemes()

      expect(component.filteredThemes.length).toBe(4)
    })
  })

  describe('toggleThemes', () => {
    it('should toggle themesShowMore and update filtered themes', () => {
      const setFilteredThemesSpy = jest.spyOn(component, 'setFilteredThemes')

      component.themesShowMore = false
      component.toggleThemes()

      expect(component.themesShowMore).toBe(true)
      expect(setFilteredThemesSpy).toHaveBeenCalled()
    })
  })

  describe('selectTheme', () => {
    it('should select a theme and add it to selectedThemesList', () => {
      component.filteredThemes = [
        { name: 'Theme1', identifier: 'theme1', selected: false }
      ]
      component.selectedThemesList = []

      component.selectTheme(0)

      expect(component.filteredThemes[0].selected).toBe(true)
      expect(component.selectedThemesList.length).toBe(1)
      expect(component.selectedThemesList[0].identifier).toBe('theme1')
    })

    it('should deselect a theme and remove it from selectedThemesList', () => {
      const theme = { name: 'Theme1', identifier: 'theme1', selected: true, selectedSubThemes: [] }
      component.filteredThemes = [theme]
      component.selectedThemesList = [theme]

      component.selectTheme(0)

      expect(component.filteredThemes[0].selected).toBe(false)
      expect(component.selectedThemesList.length).toBe(0)
    })

    it('should clear selectedSubThemes when deselecting a theme', () => {
      const subTheme = { identifier: 'subtheme1', selected: true }
      const theme = {
        name: 'Theme1',
        identifier: 'theme1',
        selected: true,
        selectedSubThemes: [subTheme]
      }

      component.filteredThemes = [theme]
      component.selectedThemesList = [theme]

      component.selectTheme(0)

      expect(subTheme.selected).toBe(false)
      expect(theme.selectedSubThemes.length).toBe(0)
    })
  })

  describe('selectSubTheme', () => {
    it('should select a subtheme and add it to theme.selectedSubThemes', () => {
      const subTheme = { identifier: 'subtheme1', selected: false }
      const theme = { selectedSubThemes: [] }

      component.selectSubTheme(subTheme, theme)

      expect(subTheme.selected).toBe(true)
      expect(theme.selectedSubThemes.length).toBe(1)
      // expect(theme.selectedSubThemes[0].identifier).toBe('subtheme1')
    })

    it('should deselect a subtheme and remove it from theme.selectedSubThemes', () => {
      const subTheme = { identifier: 'subtheme1', selected: true }
      const theme = { selectedSubThemes: [subTheme] }

      component.selectSubTheme(subTheme, theme)

      expect(subTheme.selected).toBe(false)
      expect(theme.selectedSubThemes.length).toBe(0)
    })
  })

  describe('canAddCompetencies', () => {
    it('should return false if no themes are selected', () => {
      component.selectedThemesList = []
      expect(component.canAddCompetencies).toBe(false)
    })

    it('should return false if any selected theme has no selected subthemes', () => {
      component.selectedThemesList = [
        { identifier: 'theme1', selectedSubThemes: [] }
      ]
      expect(component.canAddCompetencies).toBe(false)
    })

    it('should return true if all selected themes have selected subthemes', () => {
      component.selectedThemesList = [
        { identifier: 'theme1', selectedSubThemes: [{ identifier: 'subtheme1' }] }
      ]
      expect(component.canAddCompetencies).toBe(true)
    })
  })

  describe('saveCompetencies', () => {
    it('should call generateCompetencies and close the dialog with result', () => {
      const mockCompetencies = [{ id: 'comp1' }]
      jest.spyOn(component, 'generateCompetencies').mockReturnValue(mockCompetencies)

      component.saveCompetencies()

      expect(mockDialogRef.close).toHaveBeenCalledWith(mockCompetencies)
    })
  })

  describe('generateCompetencies', () => {
    it('should generate competencies list from selected themes and subthemes', () => {
      // Setup mock data
      component.comptencyAreasList = [
        {
          name: 'Area1',
          identifier: 'area1',
          description: 'Area description',
          refId: 'area-ref-1'
        }
      ]

      component.selectedThemesList = [
        {
          competency_index: 0,
          name: 'Theme1',
          identifier: 'theme1',
          description: 'Theme description',
          refId: 'theme-ref-1',
          additionalProperties: { prop1: 'value1' },
          selectedSubThemes: [
            {
              name: 'SubTheme1',
              identifier: 'subtheme1',
              description: 'Subtheme description',
              refId: 'subtheme-ref-1',
              additionalProperties: { prop2: 'value2' }
            }
          ]
        }
      ]

      const result = component.generateCompetencies()

      expect(result.length).toBe(1)
      expect(result[0].competencyAreaName).toBe('Area1')
      expect(result[0].competencyThemeName).toBe('Theme1')
      expect(result[0].competencySubThemeName).toBe('SubTheme1')
      expect(result[0].competencyThemeType).toBe('Theme')
      expect(result[0].competencyThemeAdditionalProperties).toEqual({ prop1: 'value1' })
      expect(result[0].competencySubThemeAdditionalProperties).toEqual({ prop2: 'value2' })
    })
  })

  describe('closeDialog', () => {
    it('should close the dialog without passing any data', () => {
      component.closeDialog()
      expect(mockDialogRef.close).toHaveBeenCalledWith()
    })
  })
})