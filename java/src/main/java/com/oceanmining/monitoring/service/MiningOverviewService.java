package com.oceanmining.monitoring.service;

import com.oceanmining.monitoring.dto.response.MiningOverviewRegionDTO;
import com.oceanmining.monitoring.dto.response.MiningOverviewSiteDTO;
import com.oceanmining.monitoring.dto.response.RegionForecastDailyDTO;
import com.oceanmining.monitoring.dto.response.RegionForecastHourlyDTO;
import com.oceanmining.monitoring.dto.response.SiteForecastDailyDTO;
import com.oceanmining.monitoring.dto.response.SiteForecastHourlyDTO;
import com.oceanmining.monitoring.entity.ForecastSite;
import com.oceanmining.monitoring.entity.MiningRegion;
import com.oceanmining.monitoring.entity.RegionBathymetrySummary;
import com.oceanmining.monitoring.entity.RegionCurrentForecastDaily;
import com.oceanmining.monitoring.entity.RegionCurrentForecastHourly;
import com.oceanmining.monitoring.entity.RegionForecastDaily;
import com.oceanmining.monitoring.entity.RegionForecastHourly;
import com.oceanmining.monitoring.entity.SiteBathymetry;
import com.oceanmining.monitoring.entity.SiteCurrentForecastDaily;
import com.oceanmining.monitoring.entity.SiteCurrentForecastHourly;
import com.oceanmining.monitoring.entity.SiteForecastDaily;
import com.oceanmining.monitoring.entity.SiteForecastHourly;
import com.oceanmining.monitoring.exception.ResourceNotFoundException;
import com.oceanmining.monitoring.repository.ForecastSiteRepository;
import com.oceanmining.monitoring.repository.MiningRegionRepository;
import com.oceanmining.monitoring.repository.RegionCurrentForecastDailyRepository;
import com.oceanmining.monitoring.repository.RegionCurrentForecastHourlyRepository;
import com.oceanmining.monitoring.repository.RegionBathymetrySummaryRepository;
import com.oceanmining.monitoring.repository.RegionForecastDailyRepository;
import com.oceanmining.monitoring.repository.RegionForecastHourlyRepository;
import com.oceanmining.monitoring.repository.SiteBathymetryRepository;
import com.oceanmining.monitoring.repository.SiteCurrentForecastDailyRepository;
import com.oceanmining.monitoring.repository.SiteCurrentForecastHourlyRepository;
import com.oceanmining.monitoring.repository.SiteForecastDailyRepository;
import com.oceanmining.monitoring.repository.SiteForecastHourlyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class MiningOverviewService {

    private final MiningRegionRepository miningRegionRepository;
    private final ForecastSiteRepository forecastSiteRepository;
    private final RegionForecastDailyRepository regionForecastDailyRepository;
    private final RegionForecastHourlyRepository regionForecastHourlyRepository;
    private final SiteForecastDailyRepository siteForecastDailyRepository;
    private final SiteForecastHourlyRepository siteForecastHourlyRepository;
    private final RegionBathymetrySummaryRepository regionBathymetrySummaryRepository;
    private final SiteBathymetryRepository siteBathymetryRepository;
    private final RegionCurrentForecastDailyRepository regionCurrentForecastDailyRepository;
    private final RegionCurrentForecastHourlyRepository regionCurrentForecastHourlyRepository;
    private final SiteCurrentForecastDailyRepository siteCurrentForecastDailyRepository;
    private final SiteCurrentForecastHourlyRepository siteCurrentForecastHourlyRepository;

    @Autowired
    public MiningOverviewService(
            MiningRegionRepository miningRegionRepository,
            ForecastSiteRepository forecastSiteRepository,
            RegionForecastDailyRepository regionForecastDailyRepository,
            RegionForecastHourlyRepository regionForecastHourlyRepository,
            SiteForecastDailyRepository siteForecastDailyRepository,
            SiteForecastHourlyRepository siteForecastHourlyRepository,
            RegionBathymetrySummaryRepository regionBathymetrySummaryRepository,
            SiteBathymetryRepository siteBathymetryRepository,
            RegionCurrentForecastDailyRepository regionCurrentForecastDailyRepository,
            RegionCurrentForecastHourlyRepository regionCurrentForecastHourlyRepository,
            SiteCurrentForecastDailyRepository siteCurrentForecastDailyRepository,
            SiteCurrentForecastHourlyRepository siteCurrentForecastHourlyRepository) {
        this.miningRegionRepository = miningRegionRepository;
        this.forecastSiteRepository = forecastSiteRepository;
        this.regionForecastDailyRepository = regionForecastDailyRepository;
        this.regionForecastHourlyRepository = regionForecastHourlyRepository;
        this.siteForecastDailyRepository = siteForecastDailyRepository;
        this.siteForecastHourlyRepository = siteForecastHourlyRepository;
        this.regionBathymetrySummaryRepository = regionBathymetrySummaryRepository;
        this.siteBathymetryRepository = siteBathymetryRepository;
        this.regionCurrentForecastDailyRepository = regionCurrentForecastDailyRepository;
        this.regionCurrentForecastHourlyRepository = regionCurrentForecastHourlyRepository;
        this.siteCurrentForecastDailyRepository = siteCurrentForecastDailyRepository;
        this.siteCurrentForecastHourlyRepository = siteCurrentForecastHourlyRepository;
    }

    public List<MiningOverviewRegionDTO> getRegions(Long regionId) {
        List<MiningRegion> regions;
        if (regionId == null) {
            regions = miningRegionRepository.findByIsActiveTrueOrderByRegionNameAsc();
        } else {
            regions = List.of(ensureRegionExists(regionId));
        }
        Map<Long, RegionBathymetrySummary> bathymetryMap = toRegionBathymetryMap(
                regions.stream().map(MiningRegion::getId).collect(Collectors.toList())
        );
        Map<Long, Long> siteCountMap = forecastSiteRepository.findByIsActiveTrueOrderBySiteCodeAsc().stream()
                .collect(Collectors.groupingBy(site -> site.getRegion().getId(), Collectors.counting()));

        return regions.stream()
                .map(region -> toRegionDto(
                        region,
                        siteCountMap.getOrDefault(region.getId(), 0L).intValue(),
                        bathymetryMap.get(region.getId())
                ))
                .collect(Collectors.toList());
    }

    public List<MiningOverviewSiteDTO> getSites(Long regionId) {
        List<ForecastSite> sites;
        if (regionId == null) {
            sites = forecastSiteRepository.findByIsActiveTrueOrderBySiteCodeAsc();
        } else {
            ensureRegionExists(regionId);
            sites = forecastSiteRepository.findByRegion_IdAndIsActiveTrueOrderBySiteCodeAsc(regionId);
        }
        Map<Long, SiteBathymetry> bathymetryMap = toSiteBathymetryMap(
                sites.stream().map(ForecastSite::getId).collect(Collectors.toList())
        );

        return sites.stream()
                .map(site -> toSiteDto(site, bathymetryMap.get(site.getId())))
                .collect(Collectors.toList());
    }

    public List<RegionForecastDailyDTO> getRegionDailyForecasts(Long regionId) {
        MiningRegion region = ensureRegionExists(regionId);
        List<RegionForecastDailyDTO> items = regionForecastDailyRepository
                .findByRegion_IdAndIsLatestTrueOrderByForecastDateAsc(regionId)
                .stream()
                .map(forecast -> toRegionDailyDto(region, forecast))
                .collect(Collectors.toList());
        mergeRegionDailyCurrent(regionId, items);
        return items;
    }

    public List<RegionForecastHourlyDTO> getRegionHourlyForecasts(Long regionId, LocalDate forecastDate) {
        MiningRegion region = ensureRegionExists(regionId);
        List<RegionForecastHourly> rows = forecastDate == null
                ? regionForecastHourlyRepository.findByRegion_IdAndIsLatestTrueOrderByForecastTimeAsc(regionId)
                : regionForecastHourlyRepository.findByRegion_IdAndForecastDateAndIsLatestTrueOrderByForecastTimeAsc(regionId, forecastDate);

        List<RegionForecastHourlyDTO> items = rows.stream()
                .map(forecast -> toRegionHourlyDto(region, forecast))
                .collect(Collectors.toList());
        mergeRegionHourlyCurrent(regionId, forecastDate, items);
        return items;
    }

    public List<SiteForecastDailyDTO> getSiteDailyForecasts(Long siteId) {
        ForecastSite site = ensureSiteExists(siteId);
        List<SiteForecastDailyDTO> items = siteForecastDailyRepository
                .findBySite_IdAndIsLatestTrueOrderByForecastDateAsc(siteId)
                .stream()
                .map(forecast -> toSiteDailyDto(site, forecast))
                .collect(Collectors.toList());
        mergeSiteDailyCurrent(siteId, items);
        return items;
    }

    public List<SiteForecastHourlyDTO> getSiteHourlyForecasts(Long siteId, LocalDate forecastDate) {
        ForecastSite site = ensureSiteExists(siteId);
        List<SiteForecastHourly> rows = forecastDate == null
                ? siteForecastHourlyRepository.findBySite_IdAndIsLatestTrueOrderByForecastTimeAsc(siteId)
                : siteForecastHourlyRepository.findBySite_IdAndForecastDateAndIsLatestTrueOrderByForecastTimeAsc(siteId, forecastDate);

        List<SiteForecastHourlyDTO> items = rows.stream()
                .map(forecast -> toSiteHourlyDto(site, forecast))
                .collect(Collectors.toList());
        mergeSiteHourlyCurrent(siteId, forecastDate, items);
        return items;
    }

    private MiningRegion ensureRegionExists(Long regionId) {
        return miningRegionRepository.findById(regionId)
                .orElseThrow(() -> new ResourceNotFoundException("大矿区不存在: " + regionId));
    }

    private ForecastSite ensureSiteExists(Long siteId) {
        return forecastSiteRepository.findById(siteId)
                .orElseThrow(() -> new ResourceNotFoundException("小矿区不存在: " + siteId));
    }

    private MiningOverviewRegionDTO toRegionDto(
            MiningRegion region,
            Integer siteCount,
            RegionBathymetrySummary bathymetry) {
        MiningOverviewRegionDTO dto = new MiningOverviewRegionDTO();
        dto.setId(region.getId());
        dto.setRegionCode(region.getRegionCode());
        dto.setRegionName(region.getRegionName());
        dto.setCenterLng(region.getCenterLng());
        dto.setCenterLat(region.getCenterLat());
        dto.setBoundaryPolygon(region.getBoundaryPolygon());
        dto.setSiteCount(siteCount);
        if (bathymetry != null) {
            dto.setDepthMinMeters(bathymetry.getDepthMinMeters());
            dto.setDepthMaxMeters(bathymetry.getDepthMaxMeters());
            dto.setDepthAvgMeters(bathymetry.getDepthAvgMeters());
            dto.setCenterDepthMeters(bathymetry.getCenterDepthMeters());
            dto.setBathymetrySampleCount(bathymetry.getSampleCount());
            dto.setBathymetryUpdatedAt(bathymetry.getUpdatedAt());
        }
        return dto;
    }

    private MiningOverviewSiteDTO toSiteDto(ForecastSite site, SiteBathymetry bathymetry) {
        MiningOverviewSiteDTO dto = new MiningOverviewSiteDTO();
        dto.setId(site.getId());
        dto.setRegionId(site.getRegion().getId());
        dto.setRegionName(site.getRegion().getRegionName());
        dto.setSiteCode(site.getSiteCode());
        dto.setSiteName(site.getSiteName());
        dto.setLng(site.getLng());
        dto.setLat(site.getLat());
        if (bathymetry != null) {
            dto.setDepthMeters(bathymetry.getDepthMeters());
            dto.setElevationMeters(bathymetry.getElevationMeters());
            dto.setBathymetryUpdatedAt(bathymetry.getUpdatedAt());
        }
        return dto;
    }

    private Map<Long, RegionBathymetrySummary> toRegionBathymetryMap(Collection<Long> regionIds) {
        if (regionIds.isEmpty()) {
            return Map.of();
        }
        return regionBathymetrySummaryRepository.findByRegion_IdIn(regionIds)
                .stream()
                .collect(Collectors.toMap(item -> item.getRegion().getId(), item -> item, (left, right) -> right));
    }

    private Map<Long, SiteBathymetry> toSiteBathymetryMap(Collection<Long> siteIds) {
        if (siteIds.isEmpty()) {
            return Map.of();
        }
        return siteBathymetryRepository.findBySite_IdIn(siteIds)
                .stream()
                .collect(Collectors.toMap(item -> item.getSite().getId(), item -> item, (left, right) -> right));
    }

    private RegionForecastDailyDTO toRegionDailyDto(
            MiningRegion region,
            RegionForecastDaily forecast) {
        RegionForecastDailyDTO dto = new RegionForecastDailyDTO();
        dto.setRegionId(region.getId());
        dto.setRegionName(region.getRegionName());
        dto.setBaseDate(forecast.getBaseDate());
        dto.setRunCycle(forecast.getRunCycle());
        dto.setForecastDate(forecast.getForecastDate());
        dto.setWindSpeedAvg(forecast.getWindSpeedAvg());
        dto.setWindSpeedMax(forecast.getWindSpeedMax());
        dto.setGustMax(forecast.getGustMax());
        dto.setWaveHeightAvg(forecast.getWaveHeightAvg());
        dto.setWaveHeightMax(forecast.getWaveHeightMax());
        dto.setWavePeriodAvg(forecast.getWavePeriodAvg());
        dto.setWindDirMean(forecast.getWindDirMean());
        dto.setWaveDirMean(forecast.getWaveDirMean());
        dto.setCurrentSpeedAvg(forecast.getCurrentSpeedAvg());
        dto.setCurrentSpeedMax(forecast.getCurrentSpeedMax());
        dto.setCurrentDirMean(forecast.getCurrentDirMean());
        dto.setHourCount(forecast.getHourCount());
        return dto;
    }

    private RegionForecastHourlyDTO toRegionHourlyDto(
            MiningRegion region,
            RegionForecastHourly forecast) {
        RegionForecastHourlyDTO dto = new RegionForecastHourlyDTO();
        dto.setRegionId(region.getId());
        dto.setRegionName(region.getRegionName());
        dto.setBaseDate(forecast.getBaseDate());
        dto.setRunCycle(forecast.getRunCycle());
        dto.setForecastDate(forecast.getForecastDate());
        dto.setForecastTime(forecast.getForecastTime());
        dto.setForecastHour(forecast.getForecastHour());
        dto.setWindSpeedAvg(forecast.getWindSpeedAvg());
        dto.setWindSpeedMax(forecast.getWindSpeedMax());
        dto.setWindDirMean(forecast.getWindDirMean());
        dto.setGustMax(forecast.getGustMax());
        dto.setWaveHeightAvg(forecast.getWaveHeightAvg());
        dto.setWaveHeightMax(forecast.getWaveHeightMax());
        dto.setWavePeriodAvg(forecast.getWavePeriodAvg());
        dto.setWaveDirMean(forecast.getWaveDirMean());
        dto.setCurrentSpeedAvg(forecast.getCurrentSpeedAvg());
        dto.setCurrentSpeedMax(forecast.getCurrentSpeedMax());
        dto.setCurrentDirMean(forecast.getCurrentDirMean());
        return dto;
    }

    private SiteForecastDailyDTO toSiteDailyDto(
            ForecastSite site,
            SiteForecastDaily forecast) {
        SiteForecastDailyDTO dto = new SiteForecastDailyDTO();
        dto.setSiteId(site.getId());
        dto.setRegionId(site.getRegion().getId());
        dto.setRegionName(site.getRegion().getRegionName());
        dto.setSiteCode(site.getSiteCode());
        dto.setSiteName(site.getSiteName());
        dto.setBaseDate(forecast.getBaseDate());
        dto.setRunCycle(forecast.getRunCycle());
        dto.setForecastDate(forecast.getForecastDate());
        dto.setWindSpeedAvg(forecast.getWindSpeedAvg());
        dto.setWindSpeedMax(forecast.getWindSpeedMax());
        dto.setGustMax(forecast.getGustMax());
        dto.setWaveHeightAvg(forecast.getWaveHeightAvg());
        dto.setWaveHeightMax(forecast.getWaveHeightMax());
        dto.setWavePeriodAvg(forecast.getWavePeriodAvg());
        dto.setWindDirMean(forecast.getWindDirMean());
        dto.setWaveDirMean(forecast.getWaveDirMean());
        dto.setCurrentSpeedAvg(forecast.getCurrentSpeedAvg());
        dto.setCurrentSpeedMax(forecast.getCurrentSpeedMax());
        dto.setCurrentDirMean(forecast.getCurrentDirMean());
        dto.setHourCount(forecast.getHourCount());
        return dto;
    }

    private SiteForecastHourlyDTO toSiteHourlyDto(
            ForecastSite site,
            SiteForecastHourly forecast) {
        SiteForecastHourlyDTO dto = new SiteForecastHourlyDTO();
        dto.setSiteId(site.getId());
        dto.setRegionId(site.getRegion().getId());
        dto.setRegionName(site.getRegion().getRegionName());
        dto.setSiteCode(site.getSiteCode());
        dto.setSiteName(site.getSiteName());
        dto.setBaseDate(forecast.getBaseDate());
        dto.setRunCycle(forecast.getRunCycle());
        dto.setForecastDate(forecast.getForecastDate());
        dto.setForecastTime(forecast.getForecastTime());
        dto.setForecastHour(forecast.getForecastHour());
        dto.setWindSpeed(forecast.getWindSpeed());
        dto.setWindDir(forecast.getWindDir());
        dto.setGust(forecast.getGust());
        dto.setWaveHeight(forecast.getWaveHeight());
        dto.setWavePeriod(forecast.getWavePeriod());
        dto.setWaveDir(forecast.getWaveDir());
        dto.setCurrentSpeed(forecast.getCurrentSpeed());
        dto.setCurrentDir(forecast.getCurrentDir());
        return dto;
    }

    private void mergeRegionDailyCurrent(Long regionId, List<RegionForecastDailyDTO> items) {
        if (items.isEmpty()) {
            return;
        }
        Map<LocalDate, RegionCurrentForecastDaily> currentByDate = regionCurrentForecastDailyRepository
                .findByRegion_IdAndIsLatestTrueOrderByForecastDateAsc(regionId)
                .stream()
                .collect(Collectors.toMap(
                        RegionCurrentForecastDaily::getForecastDate,
                        forecast -> forecast,
                        (left, right) -> right
                ));
        for (RegionForecastDailyDTO item : items) {
            RegionCurrentForecastDaily current = currentByDate.get(item.getForecastDate());
            if (current == null) {
                continue;
            }
            item.setCurrentSpeedAvg(current.getCurrentSpeedAvg());
            item.setCurrentSpeedMax(current.getCurrentSpeedMax());
            item.setCurrentDirMean(current.getCurrentDirMean());
        }
    }

    private void mergeRegionHourlyCurrent(Long regionId, LocalDate forecastDate, List<RegionForecastHourlyDTO> items) {
        if (items.isEmpty()) {
            return;
        }
        List<RegionCurrentForecastHourly> currentRows = forecastDate == null
                ? regionCurrentForecastHourlyRepository.findByRegion_IdAndIsLatestTrueOrderByForecastTimeAsc(regionId)
                : regionCurrentForecastHourlyRepository.findByRegion_IdAndForecastDateAndIsLatestTrueOrderByForecastTimeAsc(regionId, forecastDate);
        Map<java.time.ZonedDateTime, RegionCurrentForecastHourly> currentByTime = currentRows.stream()
                .collect(Collectors.toMap(
                        RegionCurrentForecastHourly::getForecastTime,
                        forecast -> forecast,
                        (left, right) -> right
                ));
        for (RegionForecastHourlyDTO item : items) {
            RegionCurrentForecastHourly current = currentByTime.get(item.getForecastTime());
            if (current == null) {
                continue;
            }
            item.setCurrentSpeedAvg(current.getCurrentSpeedAvg());
            item.setCurrentSpeedMax(current.getCurrentSpeedMax());
            item.setCurrentDirMean(current.getCurrentDirMean());
        }
    }

    private void mergeSiteDailyCurrent(Long siteId, List<SiteForecastDailyDTO> items) {
        if (items.isEmpty()) {
            return;
        }
        Map<LocalDate, SiteCurrentForecastDaily> currentByDate = siteCurrentForecastDailyRepository
                .findBySite_IdAndIsLatestTrueOrderByForecastDateAsc(siteId)
                .stream()
                .collect(Collectors.toMap(
                        SiteCurrentForecastDaily::getForecastDate,
                        forecast -> forecast,
                        (left, right) -> right
                ));
        for (SiteForecastDailyDTO item : items) {
            SiteCurrentForecastDaily current = currentByDate.get(item.getForecastDate());
            if (current == null) {
                continue;
            }
            item.setCurrentSpeedAvg(current.getCurrentSpeedAvg());
            item.setCurrentSpeedMax(current.getCurrentSpeedMax());
            item.setCurrentDirMean(current.getCurrentDirMean());
        }
    }

    private void mergeSiteHourlyCurrent(Long siteId, LocalDate forecastDate, List<SiteForecastHourlyDTO> items) {
        if (items.isEmpty()) {
            return;
        }
        List<SiteCurrentForecastHourly> currentRows = forecastDate == null
                ? siteCurrentForecastHourlyRepository.findBySite_IdAndIsLatestTrueOrderByForecastTimeAsc(siteId)
                : siteCurrentForecastHourlyRepository.findBySite_IdAndForecastDateAndIsLatestTrueOrderByForecastTimeAsc(siteId, forecastDate);
        Map<java.time.ZonedDateTime, SiteCurrentForecastHourly> currentByTime = currentRows.stream()
                .collect(Collectors.toMap(
                        SiteCurrentForecastHourly::getForecastTime,
                        forecast -> forecast,
                        (left, right) -> right
                ));
        for (SiteForecastHourlyDTO item : items) {
            SiteCurrentForecastHourly current = currentByTime.get(item.getForecastTime());
            if (current == null) {
                continue;
            }
            item.setCurrentSpeed(current.getCurrentSpeed());
            item.setCurrentDir(current.getCurrentDir());
        }
    }
}
