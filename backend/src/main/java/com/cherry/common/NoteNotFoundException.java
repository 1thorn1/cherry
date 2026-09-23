package com.cherry.common;

public class NoteNotFoundException extends RuntimeException {
    public NoteNotFoundException() {
        super("해당 기록을 찾을 수 없습니다");
    }
}
