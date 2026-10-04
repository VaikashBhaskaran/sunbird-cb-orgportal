import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { commonMaterialModules, commonTestingProviders, stubPipes } from '@test/helpers/testing-providers'
import { CustomFieldsService } from '../../../../users/custom-fields.service'
import { FormsListComponent } from './forms-list.component'


describe('FormsListComponent', () => {
  let component: FormsListComponent
  let fixture: ComponentFixture<FormsListComponent>

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FormsListComponent, ...stubPipes()],
      // The template uses #x="matMenu", which NO_ERRORS_SCHEMA cannot satisfy.
      imports: [...commonMaterialModules()],
      providers: [CustomFieldsService, ...commonTestingProviders()],
      // Shallow smoke test: child components in the template are not declared here.
      schemas: [NO_ERRORS_SCHEMA]
    })
    fixture = TestBed.createComponent(FormsListComponent)
    component = fixture.componentInstance
    // `length` carries a definite-assignment assertion and is only set inside a
    // subscription, so it moves undefined -> 0 mid-check and trips NG0100. Seeding it
    // keeps change detection stable for this smoke test.
    component.length = 0
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
