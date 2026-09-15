package com.cherry.search;

import com.cherry.search.dto.SearchResultResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class SearchController {

    private static final Long DEV_USER_ID = 1L;

    private final SearchService searchService;

    @GetMapping("/api/search")
    public List<SearchResultResponse> search(@RequestParam(required = false) String q) {
        return searchService.search(DEV_USER_ID, q);
    }
}
