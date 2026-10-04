import { BudgetschemepopupComponent } from './budgetschemepopup.component'
import { MatDialogRef } from '@angular/material/dialog'
jest.mock('@angular/material/dialog', () => ({
  MatDialogRef: jest.fn().mockImplementation(() => ({
    close: jest.fn(),
  })),
}))

// Mock the preventHtmlAndJs validator to return a valid function.
jest.mock('../../../validators/prevent-html-and-js.validator', () => ({
  preventHtmlAndJs: jest.fn().mockReturnValue(() => { }), // mock it as a valid validator function
}))

describe('BudgetschemepopupComponent', () => {
  let component: BudgetschemepopupComponent
  let dialogRefMock: MatDialogRef<BudgetschemepopupComponent>
  let data: any

  beforeEach(() => {
    dialogRefMock = new MatDialogRef<BudgetschemepopupComponent>(null as any, null as any, null as any)
    data = {
      yearlist: [2021, 2022, 2023],
      selectedYear: 2022,
      allocatedbudget: 500000,
      data: {
        schemeName: 'Training Scheme',
        trainingBudgetUtilization: 200000,
      },
    }

    // Create the component instance
    component = new BudgetschemepopupComponent(dialogRefMock, data)
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should initialize form controls correctly', () => {
    expect(component.schemeform.controls['budgetyear'].value).toBe(data.selectedYear)
    expect(component.schemeform.controls['budgetallocated'].value).toBe(data.allocatedbudget)
    expect(component.schemeform.controls['schemename'].value).toBe(data.data.schemeName)
    expect(component.schemeform.controls['budgetutilized'].value).toBe(data.data.trainingBudgetUtilization)
  })

  it('should call dialogRef.close when addsheme is called with form data', () => {
    const form = { value: { schemename: 'New Scheme', budgetutilized: 300000 } }
    // The dialog data seeds formInputData, which switches addsheme to the edit branch.
    // This test is the add branch, where the form's own value is what gets closed with.
    component.formInputData = null
    component.addsheme(form)
    expect(dialogRefMock.close).toHaveBeenCalledWith({ data: form.value })
  })

  it('should call dialogRef.close with updated formInputData when formInputData is present', () => {
    const updatedFormInputData = {
      schemeName: 'Updated Scheme',
      trainingBudgetUtilization: 300000,
      budgetyear: 2022,
      schemename: 'Updated Scheme',
      trainingBudgetAllocated: 500000,
    }
    component.formInputData = updatedFormInputData
    component.addsheme({ value: { schemename: 'Updated Scheme', budgetutilized: 300000 } })
    expect(dialogRefMock.close).toHaveBeenCalledWith({ data: updatedFormInputData })
  })

  it('should call keyPressNumbers and prevent non-numeric input', () => {
    const event = { which: 65, preventDefault: jest.fn() } // Key "A"
    const result = component.keyPressNumbers(event)
    expect(event.preventDefault).toHaveBeenCalled()
    expect(result).toBe(false)
  })

  it('should allow numeric input on keyPressNumbers', () => {
    const event = { which: 49 } // Key "1"
    const result = component.keyPressNumbers(event)
    expect(result).toBe(true)
  })

  it('should initialize yearsList with provided yearlist data', () => {
    expect(component.yearsList).toEqual(data.yearlist)
  })

  it('should set selectedYear to the provided selectedYear data', () => {
    expect(component.selectedYear).toBe(data.selectedYear)
  })

  it('should set allocatedbudget to the provided allocatedbudget data', () => {
    expect(component.allocatedbudget).toBe(data.allocatedbudget)
  })

  it('should set formInputData when data.data is provided', () => {
    expect(component.formInputData).toEqual(data.data)
  })
})
