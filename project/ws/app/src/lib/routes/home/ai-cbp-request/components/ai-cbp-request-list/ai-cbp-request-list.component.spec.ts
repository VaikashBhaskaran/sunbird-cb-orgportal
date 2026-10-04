import { of } from 'rxjs'

import { AICBPRequestListComponent } from './ai-cbp-request-list.component'

describe('AICBPRequestListComponent', () => {
  let component: AICBPRequestListComponent
  let aicbpRequestSvc: any
  let dialog: any
  let router: any
  let configSvc: any

  beforeEach(() => {
    aicbpRequestSvc = {
      getApprovalRequests: jest.fn().mockReturnValue(
        of({ result: { data: [], totalCount: 0 } })
      ),
    }
    dialog = { open: jest.fn().mockReturnValue({ afterClosed: () => of(undefined) }) }
    router = { navigate: jest.fn() }
    configSvc = { unMappedUser: { rootOrg: { rootOrgId: 'test-org-id' } } }

    component = new AICBPRequestListComponent(aicbpRequestSvc, dialog, router, configSvc)
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should fetch the approval requests on init', () => {
    component.ngOnInit()

    expect(aicbpRequestSvc.getApprovalRequests).toHaveBeenCalled()
  })

  describe('getDateRange', () => {
    it('should return today at both ends for the "today" range', () => {
      component.selectedTime = 'today'

      const range = component.getDateRange()

      expect(range.from_date).toBe(range.to_date)
    })

    it('should start the "7days" range before it ends', () => {
      component.selectedTime = '7days'

      const range = component.getDateRange()

      expect(new Date(range.from_date!).getTime())
        .toBeLessThan(new Date(range.to_date!).getTime())
    })
  })
})
