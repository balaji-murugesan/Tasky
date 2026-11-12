# tasks Specification

## Purpose
Let a single user capture, complete and remove short tasks in the browser. This is the baseline spec describing what Tasky does today; every change starts as a delta against it.

## Requirements

### Requirement: Create task
The system SHALL let the user add a task with a non-empty title of at most 120 characters.

#### Scenario: Valid title
- **WHEN** the user submits "Write the spec"
- **THEN** the task appears in the list as open
- **AND** the summary shows one more open task

#### Scenario: Empty title
- **WHEN** the user submits an empty or whitespace-only title
- **THEN** the system shows the error "title is required"
- **AND** no task is created

#### Scenario: Overlong title
- **WHEN** the user submits a title longer than 120 characters
- **THEN** the API responds 400 and no task is created

### Requirement: Complete task
The system SHALL let the user mark a task done or not done, and SHALL show done tasks struck through.

#### Scenario: Mark done
- **WHEN** the user checks an open task
- **THEN** the task is shown struck through
- **AND** the summary moves it from open to done

### Requirement: Delete task
The system SHALL let the user delete a task.

#### Scenario: Delete
- **WHEN** the user clicks the delete control on a task
- **THEN** the task is removed from the list

### Requirement: Empty state
The system SHALL show a friendly empty state when there are no tasks.

#### Scenario: No tasks
- **WHEN** the list is empty
- **THEN** the text "No tasks yet" is visible
