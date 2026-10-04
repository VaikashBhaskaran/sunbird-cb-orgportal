import { ComponentFixture, TestBed } from '@angular/core/testing'

import { NO_ERRORS_SCHEMA } from '@angular/core'
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms'

import { commonTestingProviders, stubPipes } from '@test/helpers/testing-providers'
import { CustomInputTextComponent } from './custom-input-text.component'

describe('CustomInputTextComponent', () => {
  let component: CustomInputTextComponent
  let fixture: ComponentFixture<CustomInputTextComponent>

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CustomInputTextComponent, ...stubPipes()],
      providers: [...commonTestingProviders()],
      // Shallow smoke test: child components in the template are not declared here.
      schemas: [NO_ERRORS_SCHEMA],
    })
    fixture = TestBed.createComponent(CustomInputTextComponent)
    component = fixture.componentInstance
    // The template calls question.get(...) unguarded, so the input has to be bound before
    // the first change detection.
    component.question = new UntypedFormGroup({ name: new UntypedFormControl('') })
    component.customForm = new UntypedFormGroup({})
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
