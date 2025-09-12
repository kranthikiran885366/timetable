// Advanced Timetable generation algorithm with real-time data and conflict resolution
export class TimetableGenerator {
  constructor(subjects, faculty, rooms, timeSlots, sections, courses) {
    this.subjects = subjects
    this.faculty = faculty
    this.rooms = rooms
    this.timeSlots = timeSlots
    this.sections = sections
    this.courses = courses || []
    this.schedule = []
    this.conflicts = []
    this.facultyWorkload = new Map()
    this.roomUtilization = new Map()
    this.sectionSchedules = new Map()
  }

  // Main generation function with enhanced conflict resolution
  async generateTimetable(semester, academicYear, sectionId = null, preferences = {}) {
    this.schedule = []
    this.conflicts = []
    this.facultyWorkload.clear()
    this.roomUtilization.clear()
    this.sectionSchedules.clear()

    // Initialize workload tracking
    this.initializeFacultyWorkload()
    this.initializeRoomUtilization()

    // Get sections to process
    const sectionsToProcess = sectionId
      ? this.sections.filter((s) => s.id === sectionId)
      : this.sections.filter((s) => s.semester === Number.parseInt(semester))

    if (sectionsToProcess.length === 0) {
      this.conflicts.push({
        type: "no_sections",
        message: `No sections found for semester ${semester}`,
        severity: "error",
      })
      return this.generateResult()
    }

    // Process each section
    for (const section of sectionsToProcess) {
      await this.generateSectionTimetable(section, semester, academicYear, preferences)
    }

    // Optimize schedule
    this.optimizeSchedule()

    // Validate final schedule
    this.validateSchedule()

    return this.generateResult()
  }

  async generateSectionTimetable(section, semester, academicYear, preferences) {
    // Get subjects for this section's branch and semester
    const sectionSubjects = this.subjects.filter((subject) => subject.branch_id === section.branch_id)

    // Get existing courses for this section
    const sectionCourses = this.courses.filter(
      (course) =>
        course.section_id === section.id && course.semester === semester && course.academic_year === academicYear,
    )

    if (sectionCourses.length === 0) {
      this.conflicts.push({
        type: "no_courses",
        section: section.name,
        message: `No courses assigned to section ${section.name}`,
        severity: "warning",
      })
      return
    }

    // Sort courses by priority (theory first, then labs, then electives)
    const sortedCourses = this.prioritizeCourses(sectionCourses, sectionSubjects)

    // Schedule each course
    for (const course of sortedCourses) {
      const subject = sectionSubjects.find((s) => s.id === course.subject_id)
      if (!subject) continue

      const faculty = this.faculty.find((f) => f.id === course.faculty_id)
      if (!faculty) {
        this.conflicts.push({
          type: "faculty_not_found",
          course: course.id,
          subject: subject.name,
          message: `Faculty not found for ${subject.name}`,
          severity: "error",
        })
        continue
      }

      // Calculate required hours per week
      const hoursPerWeek = course.hours_per_week || this.calculateRequiredHours(subject)

      // Schedule classes for this course
      await this.scheduleCourse(course, subject, faculty, section, hoursPerWeek, preferences)
    }
  }

  prioritizeCourses(courses, subjects) {
    return courses.sort((a, b) => {
      const subjectA = subjects.find((s) => s.id === a.subject_id)
      const subjectB = subjects.find((s) => s.id === b.subject_id)

      if (!subjectA || !subjectB) return 0

      // Priority order: Theory > Lab > Elective
      const typeOrder = { theory: 1, lab: 2, elective: 3 }
      const priorityA = typeOrder[subjectA.subject_type] || 4
      const priorityB = typeOrder[subjectB.subject_type] || 4

      if (priorityA !== priorityB) return priorityA - priorityB

      // Then by credits (higher first)
      if (subjectB.credits !== subjectA.credits) return subjectB.credits - subjectA.credits

      // Then alphabetically
      return subjectA.name.localeCompare(subjectB.name)
    })
  }

  async scheduleCourse(course, subject, faculty, section, hoursPerWeek, preferences) {
    const classesScheduled = []
    let remainingHours = hoursPerWeek

    // Determine class duration and frequency
    const { duration, frequency } = this.getClassSchedulingPattern(subject, hoursPerWeek)

    for (let i = 0; i < frequency && remainingHours > 0; i++) {
      const classHours = Math.min(duration, remainingHours)

      const scheduledClass = await this.scheduleClass(
        course,
        subject,
        faculty,
        section,
        classHours,
        preferences,
        classesScheduled,
      )

      if (scheduledClass) {
        classesScheduled.push(scheduledClass)
        remainingHours -= classHours
      } else {
        this.conflicts.push({
          type: "scheduling_failed",
          course: course.id,
          subject: subject.name,
          section: section.name,
          faculty: faculty.full_name,
          message: `Could not schedule class ${i + 1} for ${subject.name} in section ${section.name}`,
          severity: "error",
        })
      }
    }

    // Check if all required hours were scheduled
    if (remainingHours > 0) {
      this.conflicts.push({
        type: "incomplete_schedule",
        course: course.id,
        subject: subject.name,
        section: section.name,
        message: `Only scheduled ${hoursPerWeek - remainingHours}/${hoursPerWeek} hours for ${subject.name}`,
        severity: "warning",
      })
    }
  }

  getClassSchedulingPattern(subject, hoursPerWeek) {
    // Lab subjects: prefer longer sessions (2-3 hours)
    if (subject.subject_type === "lab") {
      if (hoursPerWeek >= 4) return { duration: 2, frequency: Math.ceil(hoursPerWeek / 2) }
      return { duration: hoursPerWeek, frequency: 1 }
    }

    // Theory subjects: prefer 1-hour sessions
    if (subject.subject_type === "theory") {
      return { duration: 1, frequency: hoursPerWeek }
    }

    // Default: 1-hour sessions
    return { duration: 1, frequency: hoursPerWeek }
  }

  async scheduleClass(course, subject, faculty, section, duration, preferences, existingClasses) {
    const availableSlots = this.getAvailableTimeSlots(preferences)

    // Try to find the best time slot
    for (const timeSlot of availableSlots) {
      // Check if this slot works for consecutive hours if duration > 1
      const consecutiveSlots = this.getConsecutiveSlots(timeSlot, duration)
      if (consecutiveSlots.length < duration) continue

      // Check all constraints
      const conflicts = this.checkSchedulingConflicts(consecutiveSlots, faculty, section, subject, existingClasses)

      if (conflicts.length === 0) {
        // Find suitable room
        const room = this.findBestRoom(subject, section, consecutiveSlots, preferences)

        if (room) {
          // Create the scheduled class
          const scheduledClass = this.createScheduledClass(course, subject, faculty, room, section, consecutiveSlots)

          // Update tracking maps
          this.updateSchedulingMaps(scheduledClass, faculty, room, section)

          this.schedule.push(scheduledClass)
          return scheduledClass
        } else {
          this.conflicts.push({
            type: "no_room_available",
            subject: subject.name,
            section: section.name,
            timeSlot: `${this.getDayName(timeSlot.day_of_week)} ${timeSlot.start_time}`,
            message: `No suitable room available for ${subject.name}`,
            severity: "warning",
          })
        }
      }
    }

    return null
  }

  getAvailableTimeSlots(preferences) {
    let slots = [...this.timeSlots]

    // Apply preferences
    if (preferences.preferredDays && preferences.preferredDays.length > 0) {
      slots = slots.filter((slot) => preferences.preferredDays.includes(slot.day_of_week))
    }

    if (preferences.preferredTimeRange) {
      const { start, end } = preferences.preferredTimeRange
      slots = slots.filter((slot) => {
        const slotTime = this.timeToMinutes(slot.start_time)
        const startTime = this.timeToMinutes(start)
        const endTime = this.timeToMinutes(end)
        return slotTime >= startTime && slotTime <= endTime
      })
    }

    // Sort by preference (morning first, then afternoon)
    return slots.sort((a, b) => {
      const timeA = this.timeToMinutes(a.start_time)
      const timeB = this.timeToMinutes(b.start_time)
      return timeA - timeB
    })
  }

  getConsecutiveSlots(startSlot, duration) {
    if (duration === 1) return [startSlot]

    const slots = [startSlot]
    const startTime = this.timeToMinutes(startSlot.start_time)

    // Find consecutive slots on the same day
    for (let i = 1; i < duration; i++) {
      const nextTime = startTime + i * 60 // Assuming 1-hour slots
      const nextSlot = this.timeSlots.find(
        (slot) => slot.day_of_week === startSlot.day_of_week && this.timeToMinutes(slot.start_time) === nextTime,
      )

      if (nextSlot) {
        slots.push(nextSlot)
      } else {
        break // No consecutive slot available
      }
    }

    return slots
  }

  checkSchedulingConflicts(timeSlots, faculty, section, subject, existingClasses) {
    const conflicts = []

    for (const timeSlot of timeSlots) {
      const timeKey = `${timeSlot.day_of_week}-${timeSlot.start_time}`

      // Check faculty availability
      if (this.isFacultyBusy(faculty.id, timeKey)) {
        conflicts.push({
          type: "faculty_conflict",
          faculty: faculty.full_name,
          timeSlot: timeKey,
        })
      }

      // Check section availability
      if (this.isSectionBusy(section.id, timeKey)) {
        conflicts.push({
          type: "section_conflict",
          section: section.name,
          timeSlot: timeKey,
        })
      }

      // Check faculty workload limits
      if (this.exceedsFacultyWorkload(faculty.id)) {
        conflicts.push({
          type: "faculty_overload",
          faculty: faculty.full_name,
          maxHours: faculty.max_hours_per_week,
        })
      }
    }

    return conflicts
  }

  findBestRoom(subject, section, timeSlots, preferences) {
    const suitableRooms = this.rooms.filter((room) => {
      // Check capacity
      if (room.capacity < section.max_students) return false

      // Check room type preference
      if (subject.subject_type === "lab" && room.type !== "lab") return false

      // Check availability for all time slots
      return timeSlots.every((timeSlot) => {
        const timeKey = `${timeSlot.day_of_week}-${timeSlot.start_time}`
        return !this.isRoomBusy(room.id, timeKey)
      })
    })

    if (suitableRooms.length === 0) return null

    // Prefer rooms with matching equipment for labs
    if (subject.subject_type === "lab") {
      const labRooms = suitableRooms.filter((room) => room.equipment && room.equipment.length > 0)
      if (labRooms.length > 0) return labRooms[0]
    }

    // Return the room with appropriate capacity (not too big, not too small)
    return suitableRooms.sort((a, b) => {
      const diffA = Math.abs(a.capacity - section.max_students)
      const diffB = Math.abs(b.capacity - section.max_students)
      return diffA - diffB
    })[0]
  }

  createScheduledClass(course, subject, faculty, room, section, timeSlots) {
    return {
      id: `${course.id}-${timeSlots[0].id}`,
      course_id: course.id,
      subject_id: subject.id,
      faculty_id: faculty.id,
      room_id: room.id,
      section_id: section.id,
      time_slots: timeSlots.map((slot) => slot.id),
      day_of_week: timeSlots[0].day_of_week,
      start_time: timeSlots[0].start_time,
      end_time: timeSlots[timeSlots.length - 1].end_time,
      duration: timeSlots.length,
      semester: course.semester,
      academic_year: course.academic_year,
      max_students: Math.min(room.capacity, section.max_students),
      subject_name: subject.name,
      subject_code: subject.code,
      faculty_name: faculty.full_name,
      room_name: room.name,
      section_name: section.name,
      created_at: new Date().toISOString(),
    }
  }

  // Helper methods for tracking and validation
  initializeFacultyWorkload() {
    this.faculty.forEach((faculty) => {
      this.facultyWorkload.set(faculty.id, {
        currentHours: 0,
        maxHours: faculty.max_hours_per_week || 20,
        schedule: new Map(),
      })
    })
  }

  initializeRoomUtilization() {
    this.rooms.forEach((room) => {
      this.roomUtilization.set(room.id, new Map())
    })
  }

  updateSchedulingMaps(scheduledClass, faculty, room, section) {
    // Update faculty workload
    const facultyData = this.facultyWorkload.get(faculty.id)
    if (facultyData) {
      facultyData.currentHours += scheduledClass.duration
      scheduledClass.time_slots.forEach((slotId) => {
        const timeSlot = this.timeSlots.find((slot) => slot.id === slotId)
        if (timeSlot) {
          const timeKey = `${timeSlot.day_of_week}-${timeSlot.start_time}`
          facultyData.schedule.set(timeKey, scheduledClass.id)
        }
      })
    }

    // Update room utilization
    const roomData = this.roomUtilization.get(room.id)
    if (roomData) {
      scheduledClass.time_slots.forEach((slotId) => {
        const timeSlot = this.timeSlots.find((slot) => slot.id === slotId)
        if (timeSlot) {
          const timeKey = `${timeSlot.day_of_week}-${timeSlot.start_time}`
          roomData.set(timeKey, scheduledClass.id)
        }
      })
    }

    // Update section schedule
    if (!this.sectionSchedules.has(section.id)) {
      this.sectionSchedules.set(section.id, new Map())
    }
    const sectionData = this.sectionSchedules.get(section.id)
    scheduledClass.time_slots.forEach((slotId) => {
      const timeSlot = this.timeSlots.find((slot) => slot.id === slotId)
      if (timeSlot) {
        const timeKey = `${timeSlot.day_of_week}-${timeSlot.start_time}`
        sectionData.set(timeKey, scheduledClass.id)
      }
    })
  }

  isFacultyBusy(facultyId, timeKey) {
    const facultyData = this.facultyWorkload.get(facultyId)
    return facultyData && facultyData.schedule.has(timeKey)
  }

  isRoomBusy(roomId, timeKey) {
    const roomData = this.roomUtilization.get(roomId)
    return roomData && roomData.has(timeKey)
  }

  isSectionBusy(sectionId, timeKey) {
    const sectionData = this.sectionSchedules.get(sectionId)
    return sectionData && sectionData.has(timeKey)
  }

  exceedsFacultyWorkload(facultyId) {
    const facultyData = this.facultyWorkload.get(facultyId)
    return facultyData && facultyData.currentHours >= facultyData.maxHours
  }

  optimizeSchedule() {
    // Try to minimize gaps in schedules
    // Group classes by section and day to reduce travel time
    // Balance workload across faculty members

    const sectionSchedules = new Map()

    // Group by section
    this.schedule.forEach((scheduledClass) => {
      if (!sectionSchedules.has(scheduledClass.section_id)) {
        sectionSchedules.set(scheduledClass.section_id, [])
      }
      sectionSchedules.get(scheduledClass.section_id).push(scheduledClass)
    })

    // Analyze and suggest optimizations
    sectionSchedules.forEach((classes, sectionId) => {
      const section = this.sections.find((s) => s.id === sectionId)
      if (!section) return

      // Check for large gaps in daily schedules
      const dailySchedules = new Map()
      classes.forEach((cls) => {
        if (!dailySchedules.has(cls.day_of_week)) {
          dailySchedules.set(cls.day_of_week, [])
        }
        dailySchedules.get(cls.day_of_week).push(cls)
      })

      dailySchedules.forEach((dayClasses, day) => {
        if (dayClasses.length > 1) {
          dayClasses.sort((a, b) => this.timeToMinutes(a.start_time) - this.timeToMinutes(b.start_time))

          for (let i = 1; i < dayClasses.length; i++) {
            const prevEnd = this.timeToMinutes(dayClasses[i - 1].end_time)
            const currentStart = this.timeToMinutes(dayClasses[i].start_time)
            const gap = currentStart - prevEnd

            if (gap > 120) {
              // More than 2 hours gap
              this.conflicts.push({
                type: "schedule_gap",
                section: section.name,
                day: this.getDayName(day),
                gap: `${gap / 60} hours`,
                message: `Large gap in schedule for ${section.name} on ${this.getDayName(day)}`,
                severity: "info",
              })
            }
          }
        }
      })
    })
  }

  validateSchedule() {
    // Final validation to ensure no conflicts exist
    const timeSlotMap = new Map()

    this.schedule.forEach((scheduledClass) => {
      scheduledClass.time_slots.forEach((slotId) => {
        const timeSlot = this.timeSlots.find((slot) => slot.id === slotId)
        if (!timeSlot) return

        const timeKey = `${timeSlot.day_of_week}-${timeSlot.start_time}`

        // Check faculty conflicts
        const facultyKey = `faculty-${scheduledClass.faculty_id}-${timeKey}`
        if (timeSlotMap.has(facultyKey)) {
          this.conflicts.push({
            type: "validation_faculty_conflict",
            faculty: scheduledClass.faculty_name,
            timeSlot: timeKey,
            classes: [timeSlotMap.get(facultyKey), scheduledClass.id],
            message: `Faculty ${scheduledClass.faculty_name} has conflicting classes`,
            severity: "error",
          })
        } else {
          timeSlotMap.set(facultyKey, scheduledClass.id)
        }

        // Check room conflicts
        const roomKey = `room-${scheduledClass.room_id}-${timeKey}`
        if (timeSlotMap.has(roomKey)) {
          this.conflicts.push({
            type: "validation_room_conflict",
            room: scheduledClass.room_name,
            timeSlot: timeKey,
            classes: [timeSlotMap.get(roomKey), scheduledClass.id],
            message: `Room ${scheduledClass.room_name} has conflicting bookings`,
            severity: "error",
          })
        } else {
          timeSlotMap.set(roomKey, scheduledClass.id)
        }

        // Check section conflicts
        const sectionKey = `section-${scheduledClass.section_id}-${timeKey}`
        if (timeSlotMap.has(sectionKey)) {
          this.conflicts.push({
            type: "validation_section_conflict",
            section: scheduledClass.section_name,
            timeSlot: timeKey,
            classes: [timeSlotMap.get(sectionKey), scheduledClass.id],
            message: `Section ${scheduledClass.section_name} has conflicting classes`,
            severity: "error",
          })
        } else {
          timeSlotMap.set(sectionKey, scheduledClass.id)
        }
      })
    })
  }

  generateResult() {
    const stats = this.generateAdvancedStats()

    return {
      schedule: this.schedule,
      conflicts: this.conflicts,
      stats,
      facultyWorkload: Array.from(this.facultyWorkload.entries()).map(([facultyId, data]) => ({
        facultyId,
        faculty: this.faculty.find((f) => f.id === facultyId)?.full_name,
        currentHours: data.currentHours,
        maxHours: data.maxHours,
        utilization: Math.round((data.currentHours / data.maxHours) * 100),
      })),
      roomUtilization: Array.from(this.roomUtilization.entries()).map(([roomId, schedule]) => ({
        roomId,
        room: this.rooms.find((r) => r.id === roomId)?.name,
        hoursUsed: schedule.size,
        totalSlots: this.timeSlots.length,
        utilization: Math.round((schedule.size / this.timeSlots.length) * 100),
      })),
      sectionSchedules: Array.from(this.sectionSchedules.entries()).map(([sectionId, schedule]) => ({
        sectionId,
        section: this.sections.find((s) => s.id === sectionId)?.name,
        totalClasses: schedule.size,
        schedule: Array.from(schedule.entries()),
      })),
    }
  }

  generateAdvancedStats() {
    const totalClasses = this.schedule.length
    const uniqueFaculty = new Set(this.schedule.map((s) => s.faculty_id)).size
    const uniqueRooms = new Set(this.schedule.map((s) => s.room_id)).size
    const uniqueSections = new Set(this.schedule.map((s) => s.section_id)).size

    // Calculate utilization rates
    const totalPossibleSlots = this.timeSlots.length * this.rooms.length
    const utilizationRate = totalClasses > 0 ? (totalClasses / totalPossibleSlots) * 100 : 0

    // Faculty workload analysis
    const facultyWorkloads = Array.from(this.facultyWorkload.values())
    const avgFacultyUtilization =
      facultyWorkloads.length > 0
        ? (facultyWorkloads.reduce((sum, f) => sum + f.currentHours / f.maxHours, 0) / facultyWorkloads.length) * 100
        : 0

    // Conflict analysis
    const conflictsByType = this.conflicts.reduce((acc, conflict) => {
      acc[conflict.type] = (acc[conflict.type] || 0) + 1
      return acc
    }, {})

    const conflictsBySeverity = this.conflicts.reduce((acc, conflict) => {
      acc[conflict.severity] = (acc[conflict.severity] || 0) + 1
      return acc
    }, {})

    return {
      totalClasses,
      uniqueFaculty,
      uniqueRooms,
      uniqueSections,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
      avgFacultyUtilization: Math.round(avgFacultyUtilization * 100) / 100,
      totalConflicts: this.conflicts.length,
      conflictsByType,
      conflictsBySeverity,
      generatedAt: new Date().toISOString(),
    }
  }

  // Utility methods
  calculateRequiredHours(subject) {
    // Default calculation based on credits and subject type
    if (subject.subject_type === "lab") {
      return Math.max(2, subject.credits * 2) // Labs typically need more hours
    }
    return Math.max(1, subject.credits) // Theory subjects
  }

  timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(":").map(Number)
    return hours * 60 + minutes
  }

  getDayName(dayNumber) {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    return days[dayNumber] || `Day ${dayNumber}`
  }
}
