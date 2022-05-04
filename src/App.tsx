import React from 'react';
import { useGetStudyQuery, useGetProtocolQuery, useGetSubjectQuery, useGetEncountersQuery, useGetObservationsQuery, Encounter, Observation, ResearchSubject, PlanDefinition } from './features/soaFHIR/soaFHIR';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';

function getTimelines(subject: ResearchSubject, protocol: PlanDefinition, encounters: Encounter[], observations: Observation[]) {

  const startDate = new Date(subject.period.start);
  const studyActions = protocol.action.filter((action) => action.relatedAction !== undefined).map((action) => {
    const modifier = action.relatedAction![0].relationship === "before" ? -1 : 1;
    const low = action.relatedAction![0].offsetRange?.low && modifier * action.relatedAction![0].offsetRange.low.value;
    const high = action.relatedAction![0].offsetRange?.high && modifier * action.relatedAction![0].offsetRange.high.value;
    return { title: action.title, description: action.description, 
      start: low && new Date(startDate.valueOf() + low * 24 * 60 * 60 * 1000),
      end: high && new Date(startDate.valueOf() + high * 24 * 60 * 60 * 1000)
    };
  });

  let modifiedEncounters = encounters.map((encounter) => {let newEncounter: Encounter = Object.assign({}, encounter); newEncounter.effectiveDateTime = encounter.period.start; return newEncounter;});
  let sortedEvents = [...modifiedEncounters, ...observations].sort((a,b) => a.effectiveDateTime < b.effectiveDateTime ? -1 : 1);

  return (
  <Box sx={{ minWidth: 120 }}>
    { studyActions.map((action) => {
      return (
      <Timeline position="alternate">
        <TimelineItem>
              <TimelineOppositeContent color="text.secondary">{(action.start && action.start.toString()) || "Study Start"}</TimelineOppositeContent>
              <TimelineSeparator><TimelineDot/><TimelineConnector/></TimelineSeparator>
              <TimelineContent>{action.title}</TimelineContent>
        </TimelineItem>
        { sortedEvents.filter((event) => (action.start && new Date(event.effectiveDateTime) > action.start) && 
          (action.end && new Date(event.effectiveDateTime) < action.end)).map((event) => {
            const isObservation = 'code' in event;
            return (
            <TimelineItem>
              <TimelineOppositeContent color="text.secondary">{event.effectiveDateTime}</TimelineOppositeContent>
              <TimelineSeparator><TimelineDot color={isObservation ? "secondary" : "success"}/><TimelineConnector/></TimelineSeparator>
              <TimelineContent color={isObservation ? "secondary" : "success"}>
                {isObservation ? "Observation" : "Encounter"} {event.id}</TimelineContent>
            </TimelineItem>
          );
        })
        }
        <TimelineItem>
              <TimelineOppositeContent color="text.secondary">{(action.end && action.end.toString()) || "Study End"}</TimelineOppositeContent>
              <TimelineSeparator><TimelineDot/><TimelineConnector/></TimelineSeparator>
              <TimelineContent>{action.title}</TimelineContent>
        </TimelineItem>
      </Timeline>
      );
    })}
  </Box>
  );
}

export default function App() {
  const { data: studies } = useGetStudyQuery();
  const [study, setStudy] = React.useState('');

  const [protocolId, setProtocolId] = React.useState('');
  const { data: protocol } = useGetProtocolQuery(protocolId, {skip: protocolId === ''})

  const { data: subjects } = useGetSubjectQuery(study, {skip: study === ''});
  const [subjectId, setSubjectId] = React.useState('');
  const [subject, setSubject] = React.useState<ResearchSubject>();

  const { data: encounters } = useGetEncountersQuery(subjectId, {skip: subjectId === ''});
  const { data: observations } = useGetObservationsQuery(subjectId, {skip: subjectId === ''});

  const handleStudyChange = (event: SelectChangeEvent) => {
    const [selectedStudyId, selectedProtocolId] = event.target.value.split("^");
    setStudy(selectedStudyId);
    setProtocolId(selectedProtocolId);
  }
  const handleSubjectChange = (event: SelectChangeEvent) => {
    setSubjectId(event.target.value as string);
    setSubject(subjects?.find((subject) => subject.individual.reference === event.target.value));
  }

  console.log("Subject: " + subject);
  console.log("Subjects: " + subjects);
  console.log("Protocol: " + protocol);
  console.log("Encounters: " + encounters);
  console.log("Observations: " + observations);

  return (
    <>
      <Box sx={{ minWidth: 120 }}>
        <FormControl fullWidth>
          <InputLabel id="demo-simple-select-label">ResearchStudy</InputLabel>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={study + "^" + protocolId}
            label="Research Study"
            onChange={handleStudyChange}
          >
            {studies && studies.map((study) => (
              <MenuItem key={study.id} value={study.id + "^" + study.protocol[0].reference}>{study.title}</MenuItem>
             ))}
          </Select>
        </FormControl>
        { subjects &&
        <FormControl fullWidth>
          <InputLabel id="demo-simple-select-label">ResearchSubject</InputLabel>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={subjectId}
            label="Research Subject"
            onChange={handleSubjectChange}
          >
            {subjects.map((subject) => (
              <MenuItem key={subject.id} value={subject.individual.reference}>{subject.id}</MenuItem>
             ))}
          </Select>
        </FormControl>
        }
      </Box>
      { subject && protocol && encounters && observations && getTimelines(subject, protocol, encounters, observations) }
    </>
  );
}
