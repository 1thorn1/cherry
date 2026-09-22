package com.cherry.park;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "park_visit")
@IdClass(ParkVisitId.class)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ParkVisit {

    @Id
    @Column(name = "visitor_id")
    private Long visitorId;

    @Id
    @Column(name = "host_id")
    private Long hostId;

    @Id
    @Column(name = "visited_on")
    private LocalDate visitedOn;

    public static ParkVisit create(Long visitorId, Long hostId, LocalDate visitedOn) {
        ParkVisit visit = new ParkVisit();
        visit.visitorId = visitorId;
        visit.hostId = hostId;
        visit.visitedOn = visitedOn;
        return visit;
    }
}
