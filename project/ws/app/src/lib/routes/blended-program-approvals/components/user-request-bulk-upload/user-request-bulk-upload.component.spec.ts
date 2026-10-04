import { of } from 'rxjs'

import { UserRequestBulkUploadComponent } from './user-request-bulk-upload.component'

describe('UserRequestBulkUploadComponent', () => {
  let component: UserRequestBulkUploadComponent
  let activeRouter: any
  let contentSvc: any
  let dialog: any
  let snackBar: any

  const unMappedUser = { rootOrg: { rootOrgId: 'test-org-id' } }

  beforeEach(() => {
    activeRouter = {
      parent: { snapshot: { data: { configService: { unMappedUser } } } },
      snapshot: { data: {} },
    }
    contentSvc = {}
    dialog = { open: jest.fn().mockReturnValue({ afterClosed: () => of(undefined) }) }
    snackBar = { open: jest.fn() }

    component = new UserRequestBulkUploadComponent(activeRouter, contentSvc, dialog, snackBar)
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnInit', () => {
    it('should take the signed-in user off the parent route and clear the results', () => {
      const emitSpy = jest.spyOn(component.successUserData, 'emit')

      component.ngOnInit()

      expect(component.userProfile).toBe(unMappedUser)
      expect(emitSpy).toHaveBeenCalledWith([])
    })

    it('should pick up the collection id from the program it is given', () => {
      component.programData = { identifier: 'program-123' }

      component.ngOnInit()

      expect(component.collectionId).toBe('program-123')
    })

    it('should cope with a route that resolved no config', () => {
      activeRouter.parent = null

      expect(() => component.ngOnInit()).not.toThrow()
      expect(component.userProfile).toBeUndefined()
    })
  })
})
