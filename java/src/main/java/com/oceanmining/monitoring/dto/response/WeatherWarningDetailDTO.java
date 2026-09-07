package com.oceanmining.monitoring.dto.response;

import com.fasterxml.jackson.databind.JsonNode;

public class WeatherWarningDetailDTO extends WeatherWarningDTO {

    private String bulletinText;
    private JsonNode forecastData;

    public String getBulletinText() { return bulletinText; }
    public void setBulletinText(String bulletinText) { this.bulletinText = bulletinText; }
    public JsonNode getForecastData() { return forecastData; }
    public void setForecastData(JsonNode forecastData) { this.forecastData = forecastData; }
}
