import React, { useState, useEffect } from "react";
import axios from "axios";
import { useContext } from "react";
import { AuthContext } from "../../states/AuthContext";
import Topbar from "../../components/topbar/Topbar";
import Sidebar from "../../components/sidebar/Sidebar";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    BarController,
    LineController
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import "./Analytics.css";

// Chart.jsの設定
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    BarController,
    LineController
);

function Analytics() {
    const { user } = useContext(AuthContext);
    const [keywordData, setKeywordData] = useState([]);
    const [likeRangeData, setLikeRangeData] = useState([]);
    const [totalLikes, setTotalLikes] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('simple'); // 'simple' or 'detailed'

    useEffect(() => {
        fetchAnalyticsData();
    }, []);

    const fetchAnalyticsData = async () => {
        try {
            setLoading(true);
            console.log("Fetching analytics data...");
            const [keywordsResponse, popularityResponse, totalLikesResponse] = await Promise.all([
                axios.get("/api/analytics/popular-keywords-detailed"),
                axios.get("/api/analytics/keywords-by-popularity"),
                axios.get("/api/analytics/total-likes")
            ]);

            setKeywordData(keywordsResponse.data);
            setLikeRangeData(popularityResponse.data);
            setTotalLikes(totalLikesResponse.data.totalLikes || 0);
        } catch (err) {
            console.error("Analytics data fetch error:", err);
            setError("データの取得に失敗しました");
        } finally {
            setLoading(false);
        }
    };

    // 基本的なキーワードチャート用のデータ
    const simpleChartData = {
        labels: Array.isArray(keywordData) ? keywordData.slice(0, 15).map(item => item.keyword) : [],
        datasets: [
            {
                label: 'ハート総数',
                type: 'bar',
                data: Array.isArray(keywordData) ? keywordData.slice(0, 15).map(item => item.heartCount) : [],
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
                yAxisID: 'y',
                order: 2,
            },
            {
                label: '論文数',
                type: 'line',
                data: Array.isArray(keywordData) ? keywordData.slice(0, 15).map(item => item.paperCount) : [],
                backgroundColor: 'rgba(54, 162, 235, 1)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2,
                pointStyle: 'rectRot',
                pointRadius: 6,
                pointHoverRadius: 8,
                showLine: false,
                yAxisID: 'y',
                order: 1,
            },
        ],
    };

    // ❤数別キーワードチャート用のデータ
    const keywordRankingLabels = Array.isArray(keywordData) ? keywordData.slice(0, 15).map(item => item.keyword) : [];

    const keywordTotals = {};
    if (Array.isArray(likeRangeData)) {
        likeRangeData.forEach(range => {
            if (range && range.keywords && Array.isArray(range.keywords)) {
                range.keywords.forEach(item => {
                    if (keywordTotals[item.keyword]) {
                        keywordTotals[item.keyword] += item.count;
                    } else {
                        keywordTotals[item.keyword] = item.count;
                    }
                });
            }
        });
    }

    // 並び順をキーワードランキング（上位15件）に合わせる
    const allKeywords = keywordRankingLabels;

    const detailedChartData = {
        labels: allKeywords,
        datasets: Array.isArray(likeRangeData) ? likeRangeData.map((range, index) => {
            // 各レンジのデータを作成（キーワードがない場合は0で埋める）
            const rangeData = allKeywords.map(keyword => {
                if (!range || !range.keywords || !Array.isArray(range.keywords)) {
                    return 0;
                }
                const keywordData = range.keywords.find(item => item.keyword === keyword);
                return keywordData ? keywordData.count : 0;
            });

            return {
                label: range ? range.range : `レンジ ${index + 1}`,
                data: rangeData,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(255, 205, 86, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(75, 192, 192, 0.6)'
                ][index % 4],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(255, 205, 86, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(75, 192, 192, 1)'
                ][index % 4],
                borderWidth: 1,
            };
        }) : []
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const label = context.dataset.label || '';
                        if (label === '論文数') {
                            return `${label}: ${context.parsed.y}論文`;
                        } else {
                            return `${label}: ${context.parsed.y}`;
                        }
                    }
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    maxRotation: 45,
                    minRotation: 45,
                },
            },
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'ハート総数 / 論文数',
                },
                ticks: {
                    stepSize: 1,
                },
            },
        },
    };

    if (loading) {
        return (
            <>
                <Topbar />
                <div className="analytics">
                    <Sidebar />
                    <div className="analyticsWrapper">
                        <div className="analyticsContainer">
                            <div className="loadingMessage">データを読み込み中...</div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Topbar />
                <div className="analytics">
                    <Sidebar />
                    <div className="analyticsWrapper">
                        <div className="analyticsContainer">
                            <div className="errorMessage">{error}</div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Topbar />
            <div className="analytics">
                <Sidebar />
                <div className="analyticsWrapper">
                    <div className="analyticsContainer">
                        <h1 className="analyticsTitle">❤の分析</h1>

                        {/* 統計情報カード */}
                        <div className="statsGrid">
                            <div className="statCard">
                                <div className="statNumber">{Array.isArray(keywordData) ? keywordData.length : 0}</div>
                                <div className="statLabel">ユニークキーワード数</div>
                            </div>
                            <div className="statCard">
                                <div className="statNumber">
                                    {totalLikes}
                                </div>
                                <div className="statLabel">❤が押された回数
                                </div>
                            </div>
                            <div className="statCard">
                                <div className="statNumber">
                                    {Array.isArray(keywordData) && keywordData.length > 0 ?
                                        (keywordData.reduce((sum, item) => sum + item.heartCount, 0) /
                                            keywordData.reduce((sum, item) => sum + item.paperCount, 0)).toFixed(1)
                                        : 0}
                                </div>
                                <div className="statLabel">平均ハート数/論文</div>
                            </div>
                            <div className="statCard">
                                <div className="statNumber" style={{
                                    fontSize: Array.isArray(keywordData) && keywordData.length > 0 ?
                                        (() => {
                                            const topKeywords = keywordData.filter(item => item.heartCount === keywordData[0].heartCount);
                                            const totalLength = topKeywords.map(item => item.keyword).join(', ').length;
                                            if (totalLength > 50) return '0.8rem';
                                            if (totalLength > 30) return '1rem';
                                            if (totalLength > 20) return '1.2rem';
                                            return '1.5rem';
                                        })()
                                        : '1.5rem'
                                }}>
                                    {Array.isArray(keywordData) && keywordData.length > 0 ?
                                        keywordData
                                            .filter(item => item.heartCount === keywordData[0].heartCount)
                                            .map(item => item.keyword)
                                            .join(',\n')
                                        : '-'
                                    }
                                </div>
                                <div className="statLabel">
                                    最人気キーワード {Array.isArray(keywordData) && keywordData.length > 0 ? `（❤${keywordData[0].heartCount}）` : ''}
                                </div>
                            </div>
                        </div>

                        {/* 表示モード切り替えボタン */}
                        <div className="toggleButtons">
                            <button
                                className={`toggleButton ${viewMode === 'simple' ? 'active' : ''}`}
                                onClick={() => setViewMode('simple')}
                            >
                                キーワードランキング
                            </button>
                            <button
                                className={`toggleButton ${viewMode === 'detailed' ? 'active' : ''}`}
                                onClick={() => setViewMode('detailed')}
                            >
                                ❤数別 キーワード分析
                            </button>
                        </div>

                        {/* チャート表示 */}
                        <div className="chartSection">
                            <div className="chartContainer">
                                {viewMode === 'simple' ? (
                                    Array.isArray(keywordData) && keywordData.length > 0 ? (
                                        <Bar data={simpleChartData} options={chartOptions} />
                                    ) : (
                                        <div className="loadingMessage">表示するデータがありません</div>
                                    )
                                ) : (
                                    Array.isArray(likeRangeData) && likeRangeData.length > 0 ? (
                                        <Bar data={detailedChartData} options={chartOptions} />
                                    ) : (
                                        <div className="loadingMessage">表示するデータがありません</div>
                                    )
                                )}
                            </div>
                        </div>

                        {/* 詳細モードの場合、各❤範囲の詳細を表示 */}
                        {viewMode === 'detailed' && Array.isArray(likeRangeData) && likeRangeData.length > 0 && (
                            <div className="detailSection">
                                <h3 className="chartTitle">❤数別 キーワード情報</h3>
                                {likeRangeData.map((range, index) => (
                                    <div key={index} className="rangeDetail">
                                        <h4>{range ? range.range : `レンジ ${index + 1}`}</h4>
                                        <div className="keywordList">
                                            {range && range.keywords && Array.isArray(range.keywords) && range.keywords.length > 0 ? (
                                                range.keywords.slice(0, 5).map((keyword, kidx) => (
                                                    <span key={kidx} className="keywordTag">
                                                        {keyword.keyword} ({keyword.count})
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="noDataTag">データなし</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default Analytics;