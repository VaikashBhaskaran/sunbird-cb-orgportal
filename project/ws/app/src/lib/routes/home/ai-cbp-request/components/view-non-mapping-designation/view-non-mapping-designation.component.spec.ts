import { of } from 'rxjs'

import { ViewNonMappingDesignationComponent } from './view-non-mapping-designation.component'

describe('ViewNonMappingDesignationComponent', () => {
  let component: ViewNonMappingDesignationComponent
  let aicbpRequestSvc: any
  let dialog: any
  let configSvc: any

  beforeEach(() => {
    aicbpRequestSvc = {
      getNonMappingDesignationList: jest.fn().mockReturnValue(
        of({ result: { data: [], totalCount: 0 } })
      ),
    }
    dialog = { open: jest.fn().mockReturnValue({ afterClosed: () => of(undefined) }) }
    configSvc = { unMappedUser: { rootOrg: { rootOrgId: 'test-org-id' } } }

    component = new ViewNonMappingDesignationComponent(aicbpRequestSvc, dialog, configSvc)
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should read the org off the signed-in user and fetch the list on init', () => {
    component.ngOnInit()

    expect(component.rootOrgId).toBe('test-org-id')
    expect(aicbpRequestSvc.getNonMappingDesignationList).toHaveBeenCalled()
  })
})
