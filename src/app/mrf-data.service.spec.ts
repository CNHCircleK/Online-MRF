import { TestBed, inject } from '@angular/core/testing';

import { MrfDataService } from './mrf-data.service';

describe('MrfDataService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MrfDataService]
    });
  });

  it('should be created', inject([MrfDataService], (service: MrfDataService) => {
    expect(service).toBeTruthy();
  }));
});
