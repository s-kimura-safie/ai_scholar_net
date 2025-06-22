import axios from 'axios';

// Cohere APIを使用して要約を生成する関数
export async function selectKeywordsWithCohere(title, abstract) {
    const prompt = `
次の「論文内容」を読み取り、【処理方法】に従ってキーワードの関連度スコアを算出してください。

【入力】
1. キーワードリスト
[
  "Object Detection",
  "Image Classification",
  "Semantic Segmentation",
  "Instance Segmentation",
  "Pose Estimation",
  "3D Reconstruction",
  "Video Analysis",
  "Action Recognition",
  "Face Recognition",
  "Face Detection",
  "Gesture Recognition",
  "Scene Understanding",
  "Optical Flow",
  "Image Generation",
  "Image Synthesis",
  "Style Transfer",
  "Image Super-Resolution",
  "Image Denoising",
  "Image Inpainting",
  "Visual Tracking",
  "Depth Estimation",
  "Anomaly Detection",
  "Few-Shot Learning",
  "Zero-Shot Learning",
  "Self-Supervised Learning",
  "Semi-Supervised Learning",
  "Unsupervised Learning",
  "Transfer Learning",
  "Domain Adaptation",
  "Multi-Task Learning",
  "Reinforcement Learning",
  "Generative Adversarial Networks",
  "GAN",
  "Variational Autoencoder",
  "VAE",
  "Transformer",
  "Vision Transformer",
  "ViT",
  "Convolutional Neural Network",
  "CNN",
  "Graph Neural Network",
  "GNN",
  "Neural Architecture Search",
  "NAS",
  "Attention Mechanism",
  "Multi-Modal Learning",
  "Vision-Language Models",
  "VLM",
  "CLIP",
  "DALL-E",
  "Contrastive Learning",
  "Self-Attention",
  "Meta-Learning",
  "Explainable AI",
  "Interpretable Models",
  "Adversarial Attack",
  "Adversarial Defense",
  "Robustness",
  "Edge Computing",
  "Real-Time Processing",
  "3D Object Detection",
  "LiDAR",
  "Point Cloud",
  "Medical Image Analysis",
  "Remote Sensing",
  "Autonomous Driving",
  "Human Pose Estimation",
  "Object Tracking",
  "Video Object Segmentation",
  "Scene Text Recognition",
  "Optical Character Recognition",
  "Neural Style Transfer",
  "Capsule Networks",
  "Batch Normalization",
  "Data Augmentation",
  "Contrastive Predictive Coding",
  "Self-Distillation",
  "Knowledge Distillation",
  "Neural Rendering",
  "Diffusion Models",
  "Stable Diffusion",
  "Large-Scale Pretraining",
  "Foundation Models",
  "Few-Shot Adaptation",
  "Active Learning",
  "Attention-Based Models",
  "Hybrid Models",
  "Spatial-Temporal Modeling",
  "3D Human Reconstruction",
  "Multi-View Learning",
  "Cross-Modal Retrieval",
  "Synthetic Data",
  "Federated Learning",
  "Privacy-Preserving Learning",
  "Lightweight Models",
  "Model Compression",
  "Quantization",
  "Pruning",
  "Neural Radiance Fields",
  "NeRF",
  "Differentiable Rendering",
  "Image Captioning",
  "Visual Question Answering",
  "Scene Graph"
]

2. 論文内容（タイトル、要約）
title: ${title}
abstract: ${abstract}

【処理方法】
- 論文内容に関連性の高いキーワードをリストから選びます。
- キーワードは10個以内で選んでください。
- 選んだキーワードに0〜100の整数で関連度のスコアを付けてください。
- スコアの合計は必ず100点になるように割り振ってください。
- スコアが低いキーワードも0より大きい値にしてください。
- 出力は説明なしで、キーワードをキー、スコアを値としたJSON形式。
- 出力例：
{
  'Object Detection': 15,
  'Transformer': 8,
  ...
}
JSONの出力形式は絶対に守ってください。
`;

    // API Documentation: https://docs.cohere.com/v1/reference/generate
    const response = await axios.post(
        'https://api.cohere.ai/v1/generate', {
        model: 'command-r-plus',
        prompt,
        max_tokens: 2000,
        temperature: 0.5,
    },
        {
            headers: {
                Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

    return response.data.generations[0].text.trim();
}

// 論文のタイトル・要約を解析してキーワードとスコアを返す関数
export async function run(title, abstract) {
    try {
        const keywords = await selectKeywordsWithCohere(title, abstract);
        const parsedKeywords = JSON.parse(keywords);
        console.log('✅ キーワードを抽出しました:', parsedKeywords);
        return parsedKeywords;
    } catch (err) {
        console.error('❌ エラー:', err.message);
        throw err;
    }
}

export default run;
