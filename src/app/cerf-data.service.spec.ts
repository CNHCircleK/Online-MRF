import { TestBed, inject } from '@angular/core/testing';

import { CerfDataService } from './cerf-data.service';

describe('CerfDataService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CerfDataService]
    });
  });

  it('should be created', inject([CerfDataService], (service: CerfDataService) => {
    expect(service).toBeTruthy();
  }));
});
