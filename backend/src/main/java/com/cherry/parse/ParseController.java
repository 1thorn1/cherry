package com.cherry.parse;

import com.cherry.parse.dto.TaskParseRequest;
import com.cherry.parse.dto.TaskParseResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/parse")
@RequiredArgsConstructor
public class ParseController {

    private final NaturalLanguageTaskParser parser;

    @PostMapping("/task")
    public TaskParseResponse parseTask(@Valid @RequestBody TaskParseRequest request) {
        return parser.parse(request.text(), LocalDate.now());
    }
}
