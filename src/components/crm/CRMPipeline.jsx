import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Mail, Phone, Star, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

const STAGES = [
  { id: 'sourced', label: 'Sourced', color: 'bg-blue-500' },
  { id: 'screening', label: 'Screening', color: 'bg-yellow-500' },
  { id: 'interviewing', label: 'Interviewing', color: 'bg-purple-500' },
  { id: 'offer', label: 'Offer', color: 'bg-orange-500' },
  { id: 'hired', label: 'Hired', color: 'bg-green-500' }
];

export default function CRMPipeline({ candidates, onStageChange, onSelectCandidate }) {
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const candidateId = result.draggableId;
    const newStage = result.destination.droppableId;
    
    onStageChange(candidateId, newStage);
  };

  const getCandidatesByStage = (stage) => {
    return candidates.filter(c => c.stage === stage);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {STAGES.map(stage => {
          const stageCandidates = getCandidatesByStage(stage.id);
          
          return (
            <div key={stage.id} className="flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                <h3 className="font-semibold text-gray-900">{stage.label}</h3>
                <Badge variant="secondary" className="ml-auto">
                  {stageCandidates.length}
                </Badge>
              </div>

              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 space-y-2 p-2 rounded-xl transition-colors ${
                      snapshot.isDraggingOver ? 'bg-pink-50' : 'bg-gray-50'
                    }`}
                    style={{ minHeight: '500px' }}
                  >
                    {stageCandidates.map((candidate, index) => (
                      <Draggable
                        key={candidate.id}
                        draggableId={candidate.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`cursor-pointer hover:shadow-md transition-shadow ${
                              snapshot.isDragging ? 'shadow-xl' : ''
                            }`}
                            onClick={() => onSelectCandidate(candidate)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-start gap-2 mb-2">
                                {candidate.photo_url ? (
                                  <img
                                    src={candidate.photo_url}
                                    alt={candidate.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center">
                                    <User className="w-5 h-5 text-pink-500" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm text-gray-900 truncate">
                                    {candidate.name}
                                  </p>
                                  {candidate.rating && (
                                    <div className="flex items-center gap-1 mt-1">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`w-3 h-3 ${
                                            i < candidate.rating
                                              ? 'text-yellow-400 fill-yellow-400'
                                              : 'text-gray-300'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {candidate.email && (
                                <div className="flex items-center gap-1 text-xs text-gray-500 mb-1 truncate">
                                  <Mail className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{candidate.email}</span>
                                </div>
                              )}

                              {candidate.phone && (
                                <div className="flex items-center gap-1 text-xs text-gray-500 mb-2 truncate">
                                  <Phone className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{candidate.phone}</span>
                                </div>
                              )}

                              {candidate.tags?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {candidate.tags.slice(0, 2).map((tag, i) => (
                                    <Badge key={i} variant="secondary" className="text-[10px]">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {candidate.tags.length > 2 && (
                                    <Badge variant="outline" className="text-[10px]">
                                      +{candidate.tags.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              )}

                              <div className="flex items-center justify-between mt-2 pt-2 border-t text-xs text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(candidate.created_date), 'MMM d')}
                                </span>
                                {candidate.source && (
                                  <span className="truncate">{candidate.source}</span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}