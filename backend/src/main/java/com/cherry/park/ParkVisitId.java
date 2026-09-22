package com.cherry.park;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.Objects;

public class ParkVisitId implements Serializable {

    private Long visitorId;
    private Long hostId;
    private LocalDate visitedOn;

    public ParkVisitId() {
    }

    public ParkVisitId(Long visitorId, Long hostId, LocalDate visitedOn) {
        this.visitorId = visitorId;
        this.hostId = hostId;
        this.visitedOn = visitedOn;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ParkVisitId that)) return false;
        return Objects.equals(visitorId, that.visitorId)
                && Objects.equals(hostId, that.hostId)
                && Objects.equals(visitedOn, that.visitedOn);
    }

    @Override
    public int hashCode() {
        return Objects.hash(visitorId, hostId, visitedOn);
    }
}
