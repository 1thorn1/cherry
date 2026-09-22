package com.cherry.parse;

import com.cherry.parse.dto.TaskParseResponse;
import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * v1 로컬 파서 (A-6-10). 정규식 기반 — LLM 호출 없음.
 * 실패해도 예외를 던지지 않고 null 필드를 반환한다 (호출부에서 조용히 무시).
 */
@Component
public class NaturalLanguageTaskParser {

    private static final String WEEKDAY_CHARS = "월화수목금토일";
    private static final DayOfWeek[] WEEKDAY_ORDER = {
            DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY,
            DayOfWeek.FRIDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY
    };

    private static final Pattern NEXT_WEEK_WEEKDAY = Pattern.compile("다음\\s*주\\s*([월화수목금토일])요?일?");
    private static final Pattern THIS_WEEK_WEEKDAY = Pattern.compile("이번\\s*주\\s*([월화수목금토일])요?일?");
    private static final Pattern BARE_WEEKDAY = Pattern.compile("([월화수목금토일])요일");
    private static final Pattern MONTH_DAY = Pattern.compile("(\\d{1,2})\\s*월\\s*(\\d{1,2})\\s*일");

    private static final Pattern AM_TIME = Pattern.compile("오전\\s*(\\d{1,2})\\s*시(?!간)(?:\\s*(\\d{1,2})\\s*분)?");
    private static final Pattern PM_TIME = Pattern.compile("오후\\s*(\\d{1,2})\\s*시(?!간)(?:\\s*(\\d{1,2})\\s*분)?");
    private static final Pattern BARE_TIME = Pattern.compile("(\\d{1,2})\\s*시(?!간)(?:\\s*(\\d{1,2})\\s*분)?");

    public TaskParseResponse parse(String text, LocalDate today) {
        LocalDate date = parseDate(text, today);
        LocalTime time = parseTime(text);

        // 날짜 언급 없이 시각만 있으면 오늘로 간주
        if (date == null && time != null) {
            date = today;
        }

        return new TaskParseResponse(date, time);
    }

    private LocalDate parseDate(String text, LocalDate today) {
        if (text.contains("내일모레") || text.contains("모레")) return today.plusDays(2);
        if (text.contains("내일")) return today.plusDays(1);
        if (text.contains("오늘")) return today;

        Matcher m = NEXT_WEEK_WEEKDAY.matcher(text);
        if (m.find()) return resolveWeekday(today, m.group(1), true);

        m = THIS_WEEK_WEEKDAY.matcher(text);
        if (m.find()) return resolveWeekday(today, m.group(1), false);

        m = MONTH_DAY.matcher(text);
        if (m.find()) {
            int month = Integer.parseInt(m.group(1));
            int day = Integer.parseInt(m.group(2));
            if (month < 1 || month > 12 || day < 1 || day > 31) return null;
            try {
                LocalDate candidate = LocalDate.of(today.getYear(), month, day);
                return candidate.isBefore(today) ? candidate.plusYears(1) : candidate;
            } catch (Exception e) {
                return null;
            }
        }

        m = BARE_WEEKDAY.matcher(text);
        if (m.find()) return resolveWeekday(today, m.group(1), false);

        return null;
    }

    private LocalDate resolveWeekday(LocalDate today, String weekdayChar, boolean nextWeek) {
        DayOfWeek target = WEEKDAY_ORDER[WEEKDAY_CHARS.indexOf(weekdayChar)];
        LocalDate thisMonday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        if (nextWeek) {
            return thisMonday.plusWeeks(1).with(TemporalAdjusters.nextOrSame(target));
        }

        LocalDate candidate = thisMonday.with(TemporalAdjusters.nextOrSame(target));
        // "이번주 화요일"을 수요일에 말했다면 이미 지난 것 — 다음 해당 요일로 보정 (원칙 4: 벌주지 않는다)
        return candidate.isBefore(today) ? today.with(TemporalAdjusters.next(target)) : candidate;
    }

    private LocalTime parseTime(String text) {
        Matcher m = AM_TIME.matcher(text);
        if (m.find()) {
            return toTime(Integer.parseInt(m.group(1)) % 12, minuteOf(m));
        }

        m = PM_TIME.matcher(text);
        if (m.find()) {
            return toTime(Integer.parseInt(m.group(1)) % 12 + 12, minuteOf(m));
        }

        if (text.contains("정오")) return LocalTime.NOON;
        if (text.contains("자정")) return LocalTime.MIDNIGHT;

        m = BARE_TIME.matcher(text);
        if (m.find()) {
            int hour = Integer.parseInt(m.group(1));
            if (hour < 0 || hour > 23) return null;
            // 오전/오후 표시가 없을 때의 관례: 1~6시는 오후, 7~12시는 그대로
            if (hour >= 1 && hour <= 6) hour += 12;
            return toTime(hour, minuteOf(m));
        }

        return null;
    }

    private int minuteOf(Matcher m) {
        return m.group(2) != null ? Integer.parseInt(m.group(2)) : 0;
    }

    private LocalTime toTime(int hour, int minute) {
        if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
        return LocalTime.of(hour, minute);
    }
}
