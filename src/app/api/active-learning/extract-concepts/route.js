import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { content, fileName } = await request.json();

        if (!content) {
            return NextResponse.json(
                { error: 'Content is required' },
                { status: 400 }
            );
        }

        // Mock concept extraction - in production, this would use AI/NLP
        const concepts = [
            {
                id: 'concept-1',
                title: 'Decentralized Technology (Blockchain)',
                description: 'The core technology enabling cryptocurrency, characterized by a distributed, unchangeable digital ledger verified across a network rather than a central authority.'
            },
            {
                id: 'concept-2',
                title: 'Cryptography and Security',
                description: 'The mathematical techniques used to secure cryptocurrency transactions and control the creation of new units.'
            },
            {
                id: 'concept-3',
                title: 'Mining and Verification Process',
                description: 'The process by which network participants in validating transactions by solving mathematical problems, which secures the network and rewards participants.'
            },
            {
                id: 'concept-4',
                title: 'Volatility and Regulatory Uncertainty',
                description: 'The primary risks associated with cryptocurrency investment due to rapid price fluctuations and evolving legal frameworks.'
            }
        ];

        return NextResponse.json({
            success: true,
            concepts: concepts,
            extractedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error extracting concepts:', error);
        return NextResponse.json(
            { error: 'Failed to extract concepts' },
            { status: 500 }
        );
    }
}