import { SimpleChanges } from '@angular/core'
import { EventCompetenciesComponent } from './event-competencies.component'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatDialog } from '@angular/material/dialog'
import { EventsService } from '../../services/events.service'

jest.mock('@angular/material/snack-bar')
jest.mock('@angular/material/dialog')
jest.mock('../../services/events.service')

describe('EventCompetenciesComponent', () => {
  let component: EventCompetenciesComponent
  let mockMatSnackBar: jest.Mocked<MatSnackBar>
  let mockDialog: jest.Mocked<MatDialog>
  let mockEventsService: jest.Mocked<EventsService>

  const mockCompetenciesList = [
    {
      competencyAreaName: 'Functional',
      themes: [
        {
          competencyThemeName: 'Theme1',
          subThems: [
            {
              competencySubThemeAdditionalProperties: {
                displayName: 'SubTheme1'
              }
            }
          ]
        }
      ]
    }
  ]

  beforeEach(() => {
    mockMatSnackBar = {
      open: jest.fn()
    } as any

    mockDialog = {
      open: jest.fn().mockReturnValue({
        afterClosed: () => ({ subscribe: jest.fn() })
      })
    } as any

    mockEventsService = {
      convertToTreeView: jest.fn().mockReturnValue(mockCompetenciesList),
      // The tabular view is the flattened counterpart of the tree view.
      convertToTabularView: jest.fn().mockReturnValue([])
    } as any

    component = new EventCompetenciesComponent(
      mockMatSnackBar,
      mockDialog,
      mockEventsService
    )
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnChanges', () => {
    it('should update competencies when competenciesList changes', () => {
      // Set the input property
      component.competenciesList = mockCompetenciesList

      const changes: SimpleChanges = {
        competenciesList: {
          currentValue: mockCompetenciesList,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      }

      component.ngOnChanges(changes)

      expect(mockEventsService.convertToTreeView).toHaveBeenCalledWith(mockCompetenciesList)
      expect(component.competencies).toEqual(mockCompetenciesList)
    })
  })

  describe('hideAnfShow', () => {
    it('should toggle collapsed state', () => {
      const row = { collapsed: true }
      component.hideAnfShow(row)
      expect(row.collapsed).toBeFalsy()

      component.hideAnfShow(row)
      expect(row.collapsed).toBeTruthy()
    })
  })

  describe('removeNode', () => {
    beforeEach(() => {
      component.competencies = [...mockCompetenciesList]
    })

    it('should remove competency area and show snackbar', () => {
      const competencyToRemove = { competencyAreaName: 'Functional' }

      component.removeNode(competencyToRemove)

      expect(component.competencies).toEqual([])
      expect(mockMatSnackBar.open).toHaveBeenCalledWith('Competency area is removed successfully.')
    })
  })

  describe('removeTheme', () => {
    beforeEach(() => {
      component.competencies = [...mockCompetenciesList]
    })

    it('should remove theme from competency area and show snackbar', () => {
      const competency = { competencyAreaName: 'Functional' }
      const themeToRemove = { competencyThemeName: 'Theme1' }

      component.removeTheme(competency, themeToRemove)

      expect(component.competencies[0].themes).toEqual([])
      expect(mockMatSnackBar.open).toHaveBeenCalledWith('Competency theme is removed successfully.')
    })
  })

  describe('removeSubTheme', () => {
    beforeEach(() => {
      component.competencies = [...mockCompetenciesList]
    })

    it('should remove sub theme and show snackbar', () => {
      const competency = { competencyAreaName: 'Functional' }
      const theme = { competencyThemeName: 'Theme1' }
      const subTheme = {
        competencySubThemeAdditionalProperties: {
          displayName: 'SubTheme1'
        }
      }

      component.removeSubTheme(competency, theme, subTheme)

      expect(component.competencies[0].themes[0].subThems).toEqual([])
      expect(mockMatSnackBar.open).toHaveBeenCalledWith('Competency sub theme is removed successfully.')
    })
  })

  describe('showAddCompetencyDialog', () => {
    it('should open dialog and update competencies when result is returned', () => {
      const mockDialogRef = {
        afterClosed: jest.fn().mockReturnValue({
          subscribe: (fn: (result: any) => void) => fn(mockCompetenciesList)
        })
      }

      mockDialog.open = jest.fn().mockReturnValue(mockDialogRef)
      const emitSpy = jest.spyOn(component.addCompetencies, 'emit')

      component.showAddCompetencyDialog()

      expect(mockDialog.open).toHaveBeenCalled()
      expect(mockEventsService.convertToTreeView).toHaveBeenCalledWith(mockCompetenciesList)
      expect(emitSpy).toHaveBeenCalledWith(mockCompetenciesList)
    })

    it('should not update competencies when dialog is closed without result', () => {
      const mockDialogRef = {
        afterClosed: jest.fn().mockReturnValue({
          subscribe: (fn: (result: any) => void) => fn(null)
        })
      }

      mockDialog.open = jest.fn().mockReturnValue(mockDialogRef)
      const emitSpy = jest.spyOn(component.addCompetencies, 'emit')

      component.showAddCompetencyDialog()

      expect(mockDialog.open).toHaveBeenCalled()
      expect(emitSpy).not.toHaveBeenCalled()
    })
  })
})