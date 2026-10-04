import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { commonTestingProviders, stubPipes } from '@test/helpers/testing-providers';
import { FileLogsComponent } from './file-logs.component';

describe('FileLogsComponent', () => {
  let component: FileLogsComponent;
  let fixture: ComponentFixture<FileLogsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FileLogsComponent, ...stubPipes()],
      providers: [...commonTestingProviders()],
      // Shallow smoke test: child components in the template are not declared here.
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(FileLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
