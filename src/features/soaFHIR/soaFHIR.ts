import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export interface ResearchStudy {
  id: string,
  identifier: {
    system: string,
    value: string,
  }[],
  title: string,
  protocol: {
      reference: string,
  }[],
}

export interface ResearchSubject {
    id: string,
    status: string,
    study: {
        reference: string,
    },
    individual: {
        reference: string,
    },
    period: {
      start: string,
      end: string,
    },
    assignedArm: string,
    actualArm: string,
}

export interface PlanDefinition {
  id: string,
  status: string,
  action: {
    title: string,
    description: string,
    relatedAction?: {
      actionId: string,
      relationship: string,
      offsetRange?: {
        low: {
          value: number,
          code: string,
        },
        high?: {
          value: number,
          code: string,
        }
      }
    }[],
    definitionUri: string
  }[],
}

export interface Encounter {
  id: string,
  status: string,
  period: { 
      start: string,
      end: string,
  },
  basedOn: {
    reference: string,
  },
  effectiveDateTime: string,
}

export interface Observation {
  id: string,
  status: string,
  category: {
    coding: {
      system: string,
      code: string,
      display: string,
    }[],
  },
  code: {
    coding: {
      system: string,
      code: string,
      display: string,
    }[],
  },
  effectiveDateTime: string, 
}


export const soaFHIR = createApi({
    baseQuery: fetchBaseQuery({
      baseUrl: 'https://api.logicahealth.org/soaconnectathon30/open/',
      prepareHeaders: (headers, {getState}) => { 
        headers.set("Accept", "application/json");
        return headers;}
    }),
    tagTypes: ['ResearchSubject', 'Encounter', 'Observation', 'ResearchStudy', 'PlanDefinition'],
    endpoints: (build) => ({
  
      getStudy: build.query<ResearchStudy[], void>({
        query: () => 'ResearchStudy',
        transformResponse: (response: {entry: any[]}) => response.entry.map((item : {resource: ResearchStudy}) => item.resource),
        providesTags: (result) => result ? 
           [
            ...result.map((subject) => ({ type: 'ResearchStudy', id: subject.id } as const)),
            { type: 'ResearchStudy', id: 'LIST' },
          ]
        : 
          [{ type: 'ResearchStudy', id: 'LIST' }],
      }),
      getSubject: build.query<ResearchSubject[], string>({
        query: (study) => `ResearchSubject?study=${study}`,
        transformResponse: (response: {entry: any[]}) => response.entry.map((item : {resource: ResearchSubject}) => item.resource),
        providesTags: (result) => result ? 
           [
            ...result.map((subject) => ({ type: 'ResearchSubject', id: subject.id } as const)),
            { type: 'ResearchSubject', id: 'LIST' },
          ]
        : 
          [{ type: 'ResearchSubject', id: 'LIST' }],
      }),
      getProtocol: build.query<PlanDefinition, string>({
        query: (plan) => plan,
        providesTags: (result) => result ? [{ type: 'PlanDefinition', id: result.id }] : []
      }),
      getEncounters: build.query<Encounter[], string>({
        query: (patient) => `Encounter?patient=${patient.split('/')[1]}`,
        transformResponse: (response: {entry: any[]}) => response.entry && response.entry.map((item : {resource: Encounter}) => item.resource),
        providesTags: (result) => result ? 
           [
            ...result.map((encounter) => ({ type: 'Encounter', id: encounter.id } as const)),
            { type: 'Encounter', id: 'LIST' },
          ]
        : 
          [{ type: 'Encounter', id: 'LIST' }],
      }),
      getObservations: build.query<Observation[], string>({
        query: (patient) => `Observation?patient=${patient.split('/')[1]}`,
        transformResponse: (response: {entry: any[]}) => response.entry && response.entry.map((item : {resource: Observation}) => item.resource),
        providesTags: (result) => result ? 
           [
            ...result.map((observation) => ({ type: 'Observation', id: observation.id } as const)),
            { type: 'Observation', id: 'LIST' },
          ]
        : 
          [{ type: 'Observation', id: 'LIST' }],
      }),
    }),
})
  
export const { 
  useGetStudyQuery,
  useGetProtocolQuery,
  useGetSubjectQuery,
  useGetEncountersQuery,
  useGetObservationsQuery,
} = soaFHIR
