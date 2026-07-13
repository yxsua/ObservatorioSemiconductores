const observatoryRepository = require(
    "../repositories/observatory.repository"
);

function toNumber(value) {
    if (value === null || value === undefined) {
        return 0;
    }

    const parsedValue = Number(value);

    return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function formatSeries(rows) {
    return rows.map((row) => ({
        label: row.label,
        value: toNumber(row.value)
    }));
}

class ObservatoryService {
    async getCatalogs() {
        const catalogs = await observatoryRepository.getCatalogOptions();

        return {
            sources: {
                sourceTypes: catalogs.sourceTypes,
                activeStates: [
                    {
                        value: "true",
                        label: "Activa"
                    },
                    {
                        value: "false",
                        label: "Inactiva"
                    }
                ]
            },
            signals: {
                fcv: catalogs.fcv,
                categories: catalogs.categories,
                sources: catalogs.sources,
                signalTypes: catalogs.signalTypes,
                impacts: catalogs.impacts,
                urgencies: catalogs.urgencies,
                scopes: catalogs.scopes,
                signalStatuses: catalogs.signalStatuses
            },
            trends: {
                trendDirections: catalogs.trendDirections,
                trendMaturity: catalogs.trendMaturity,
                trendStatuses: catalogs.trendStatuses
            },
            alerts: {
                alertLevels: catalogs.alertLevels,
                alertStatuses: catalogs.alertStatuses,
                alertOrigins: catalogs.alertOrigins
            },
            content: {
                contentTypes: catalogs.contentTypes,
                contentStatuses: catalogs.contentStatuses
            }
        };
    }

    async getSummary() {
        const [
            counts,
            signalsByMonth,
            signalsByFactor,
            contentByType,
            alertsByLevel,
            timeline
        ] = await Promise.all([
            observatoryRepository.getCounts(),
            observatoryRepository.getSignalsByMonth(),
            observatoryRepository.getSignalsByFactor(),
            observatoryRepository.getContentByType(),
            observatoryRepository.getAlertsByLevel(),
            observatoryRepository.getTimeline(10)
        ]);

        return {
            counts: {
                sources: toNumber(counts.sources),
                signals: toNumber(counts.signals),
                trends: toNumber(counts.trends),
                alerts: toNumber(counts.alerts),
                content: toNumber(counts.content)
            },
            charts: {
                signalsByMonth: formatSeries(signalsByMonth),
                signalsByFactor: formatSeries(signalsByFactor),
                contentByType: formatSeries(contentByType),
                alertsByLevel: formatSeries(alertsByLevel)
            },
            timeline: timeline.map((item, index) => ({
                id: `${item.kind}-${index}-${item.occurred_at}`,
                kind: item.kind,
                title: item.title,
                description: item.description,
                date: item.occurred_at,
                tag: item.tag,
                tone: item.tone
            }))
        };
    }

    async getSources(filters) {
        return observatoryRepository.getSources(filters);
    }

    async getSignals(filters) {
        return observatoryRepository.getSignals(filters);
    }

    async getTrends(filters) {
        return observatoryRepository.getTrends(filters);
    }

    async getAlerts(filters) {
        return observatoryRepository.getAlerts(filters);
    }

    async getContent(filters) {
        return observatoryRepository.getContent(filters);
    }
}

module.exports = new ObservatoryService();
